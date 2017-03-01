"use strict";

import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Injector } from '../core/injector';
import { Transaction } from '../core/transaction';

import { ServerMetadata } from '../metadata/server/server';

import { OrmReflector } from '../orm/reflector';

import { ServiceReflector } from '../services/reflector';
import { Logger } from '../services/logger';

import { RouterReflector } from '../router/reflector';

import { wrapPromise } from '../util/wrap-promise';

import * as http from 'http';
import debug_module = require('debug');
let debug = debug_module('express:server');

export class Server {
    constructor(private _meta: ServerMetadata) {
        this._logger = new Logger(this.meta.name || null, this.meta.logLevel);
        this._injector = new Injector(this);
        if (_meta.inject) {
            for (let q = 0; q < _meta.inject.length; q++) {
                this._injector.provide(_meta.inject[q]);
            }
        }
    }
    
    private _logger: Logger;
    get logger(): Logger {
        return this._logger;
    }
    
    private _app: express.Application;
    get app(): express.Application {
        return this._app;
    }
    
    private _injector: Injector;
    get injector(): Injector {
        return this._injector;
    }
    
    get meta(): ServerMetadata {
        return this._meta;
    }
    
    async init() {
        try {
            this.logger.info('miter', `Initializing miter server...`);
            if (typeof this.meta.port !== 'undefined') await this.createExpressApp();
            await this.reflectOrm();
            await this.startServices();
            if (typeof this.meta.port !== 'undefined') this.reflectRoutes();
        }
        catch (e) {
            this.logger.error('miter', `FATAL ERROR: Failed to launch server.`);
            this.logger.error('miter', e);
            return;
        }
        
        if (typeof this.meta.port !== 'undefined') this.listen();
    }
    errorCode: number = 0;
    async shutdown() {
        try {
            try {
                this.logger.info('miter', `Shutting down miter server...`);
                if (typeof this.meta.port !== 'undefined') await this.stopListening();
                await this.stopServices();
            }
            finally {
                this.logger.ShutDown();
            }
        }
        catch (e) {
            this.logger.error('miter', `FATAL ERROR: Failed to gracefully shutdown server.`);
            this.logger.error('miter', e);
        }
    }
    
    createExpressApp() {
        this._app = express();
        this._app.use(bodyParser.urlencoded({ extended: true }), bodyParser.json());
        if (this.meta.allowCrossOrigin) {
            this.logger.warn('miter', `Warning: server starting with cross-origin policy enabled. This should not be enabled in production.`);
            this._app.use(function(req: express.Request, res: express.Response, next) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
                next();
            });
        }
        if (this.meta.middleware && this.meta.middleware.length) {
            this._app.use(...this.meta.middleware);
        }
    }
    
    private ormReflector: OrmReflector;
    async reflectOrm() {
        let orm = this.meta.orm;
        if (orm && (typeof orm.enabled === 'undefined' || orm.enabled) && orm.db) {
            this.logger.verbose('orm', `Initializing ORM...`);
            this.ormReflector = new OrmReflector(this);
            await this.ormReflector.init();
            this.logger.info('orm', `Finished initializing ORM.`);
        }
        else if (this.meta.models && this.meta.models.length) {
            this.logger.warn('orm', `Warning: Models included in server metadata, but no orm configuration defined.`);
        }
    }
    transaction(transaction?: Transaction): Promise<Transaction> {
        return this.ormReflector.transaction(transaction);
    }
    
    private serviceReflector: ServiceReflector;
    private async startServices() {
        this.logger.verbose('services', `Starting services...`);
        this.serviceReflector = new ServiceReflector(this);
        await this.serviceReflector.reflectServices(this.meta.services || []);
        this.logger.info('services', `Finished starting services.`);
    }
    private async stopServices() {
        this.logger.verbose('services', `Shutting down services...`);
        await this.serviceReflector.shutdownServices();
        this.logger.info('services', `Finished shutting down services.`);
    }
    
    private routerReflector: RouterReflector;
    private reflectRoutes() {
        this.logger.verbose('router', `Loading routes...`);
        let router = express.Router();
        this.routerReflector = new RouterReflector(this, router);
        this.routerReflector.reflectRoutes(this.meta.controllers || []);
        this.app.use(router);
        this.logger.info('router', `Finished loading routes.`);
    }
    
    private httpServer: http.Server | undefined;
    private listen() {
        this.logger.info('miter', `Serving`);
        
        this.httpServer = this.app.listen(this.meta.port, () => this.onListening());
        this.httpServer.on("error", (err) => this.onError(err));
    }
    private async stopListening() {
        this.logger.verbose('miter', `Closing HTTP server...`);
        await wrapPromise((cb: Function) => {
            if (!this.httpServer) return cb();
            this.httpServer.close(cb);
        });
        this.logger.info('miter', `Finished closing HTTP server.`);
    }
    private onError(error: Error & { syscall?: string, code?: string }) {
        if (error.syscall !== "listen") {
            throw error;
        }
        
        let bind = (typeof this.meta.port === "string") ? `pipe ${this.meta.port}` : `port ${this.meta.port}`;
        
        // handle specific listen errors with friendly messages
        switch (error.code) {
        case "EACCES":
            this.logger.error('miter', `${bind} requires elevated privileges`);
            this.errorCode = 1;
            this.httpServer = undefined;
            this.shutdown();
            break;
        case "EADDRINUSE":
            this.logger.error('miter', `${bind} is already in use`);
            this.errorCode = 1;
            this.httpServer = undefined;
            this.shutdown();
            break;
        default:
            throw error;
        }
    }
    private onListening() {
        if (!this.httpServer) throw new Error(`onListening called, but there is no httpServer!`);
        let addr = this.httpServer.address();
        let bind = (typeof addr === "string") ? `pipe ${addr}` : `port ${addr.port}`;
        this.logger.info('miter', `Listening on ${bind}`);
    }
}
