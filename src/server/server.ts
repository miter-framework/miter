"use strict";

import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Injector } from '../core';
import { ServerMetadata } from '../metadata';
import { OrmReflector } from '../orm';
import { ServiceReflector, Logger } from '../services';
import { RouterReflector } from '../router';
import { wrapPromise } from '../util/wrap-promise';
import { clc } from '../util/clc';

import * as http from 'http';
var debug = require("debug")("express:server");

export class Server {
    constructor(private _meta: ServerMetadata) {
        this._injector = new Injector();
        this._injector.provide({provide: Server, useValue: this});
        this._injector.provide({provide: Logger, useValue: this._logger = new Logger(this.meta.logLevel)});
        if (_meta.inject) {
            for (var q = 0; q < _meta.inject.length; q++) {
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
            await this.createExpressApp();
            await this.reflectOrm();
            await this.startServices();
            this.reflectRoutes();
        }
        catch (e) {
            this.logger.error('miter', `FATAL ERROR: Failed to launch server.`);
            this.logger.error('miter', e);
            return;
        }
        
        this.listen();
    }
    errorCode: number = 0;
    async shutdown() {
        try {
            this.logger.info('miter', `Shutting down miter server...`);
            await this.stopListening();
            await this.stopServices();
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
            this.logger.trace('orm', `Initializing ORM...`);
            this.ormReflector = new OrmReflector(this);
            await this.ormReflector.init();
            this.logger.info('orm', `Finished initializing ORM.`);
        }
        else if (this.meta.models && this.meta.models.length) {
            this.logger.warn('orm', `Warning: Models included in server metadata, but no orm configuration defined.`);
        }
    }
    
    private serviceReflector: ServiceReflector;
    private async startServices() {
        this.logger.trace('services', `Starting services...`);
        this.serviceReflector = new ServiceReflector(this);
        await this.serviceReflector.reflectServices(this.meta.services || []);
        this.logger.info('services', `Finished starting services.`);
    }
    private async stopServices() {
        this.logger.trace('services', `Shutting down services...`);
        await this.serviceReflector.shutdownServices();
        this.logger.info('services', `Finished shutting down services.`);
    }
    
    private routerReflector: RouterReflector;
    private reflectRoutes() {
        this.logger.trace('router', `Loading routes...`);
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
        this.logger.trace('miter', `Closing HTTP server...`);
        await wrapPromise((cb) => {
            if (!this.httpServer) return cb();
            this.httpServer.close(cb);
        });
        this.logger.info('miter', `Finished closing HTTP server.`);
    }
    private onError(error) {
        if (error.syscall !== "listen") {
            throw error;
        }
        
        var bind = (typeof this.meta.port === "string") ? `pipe ${this.meta.port}` : `port ${this.meta.port}`;
        
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
        var addr = this.httpServer.address();
        var bind = (typeof addr === "string") ? `pipe ${addr}` : `port ${addr.port}`;
        this.logger.info('miter', `Listening on ${bind}`);
    }
}
