"use strict";

import * as createExpressApp from 'express';
import { Request, Response, Application as ExpressApp } from 'express';
import * as bodyParser from 'body-parser';

import { Injector } from '../core/injector';
import { Transaction } from '../core/transaction';

import { Injectable } from '../decorators/services/injectable.decorator';

import { ServerMetadataT, ServerMetadata } from '../metadata/server/server';

import { OrmReflector } from '../orm/reflector';

import { ServiceReflector } from '../services/reflector';
import { Logger } from '../services/logger';

import { RouterReflector } from '../router/reflector';

import { wrapPromise } from '../util/wrap-promise';

import * as http from 'http';
import * as https from 'https';
import debug_module = require('debug');
let debug = debug_module('express:server');

@Injectable()
export class Server {
    constructor(meta: ServerMetadataT) {
        this._logger = new Logger(meta.name || null, meta.logLevel);
        this._injector = new Injector(this._logger);
        this._injector.provide({ provide: Server, useValue: this });
        this._injector.provide({ provide: ServerMetadata, useValue: new ServerMetadata(meta) });
        this._meta = this._injector.resolveInjectable(ServerMetadata)!;
        for (let q = 0; q < this.meta.inject.length; q++) {
            this._injector.provide(this.meta.inject[q]);
        }
    }
    
    private _meta: ServerMetadata;
    get meta() {
        return this._meta;
    }
    
    private _logger: Logger;
    get logger(): Logger {
        return this._logger;
    }
    
    private _app: ExpressApp;
    get app(): ExpressApp {
        return this._app;
    }
    
    private _injector: Injector;
    get injector(): Injector {
        return this._injector;
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
        this._app = createExpressApp();
        this._app.use(bodyParser.urlencoded({ extended: true }), bodyParser.json());
        if (this.meta.allowCrossOrigin) {
            this.logger.warn('miter', `Warning: server starting with cross-origin policy enabled. This should not be enabled in production.`);
            this._app.use(function(req: Request, res: Response, next) {
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
            this.ormReflector = this._injector.resolveInjectable(OrmReflector)!;
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
        this.serviceReflector = this._injector.resolveInjectable(ServiceReflector)!;
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
        // let router = ExpressRouter();
        this.routerReflector = this._injector.resolveInjectable(RouterReflector)!;// new RouterReflector(this, router);
        this.routerReflector.reflectRoutes(this.meta.controllers || []);
        this.app.use(this.routerReflector.router.expressRouter);
        this.logger.info('router', `Finished loading routes.`);
    }
    
    private webServer: http.Server | https.Server| undefined;
    private listen() {
        this.logger.info('miter', `Serving`);
        
        if (this._meta.sslEnabled) {
            this.webServer = https.createServer({key: this._meta.sslPrivateKey, cert: this._meta.sslCertificate}, this.app);
        }
        else {
            this.webServer = http.createServer(this.app);
        }
        this.webServer.listen(this.meta.port, () => this.onListening());
        this.webServer.on("error", (err: any) => this.onError(err));
    }
    private async stopListening() {
        this.logger.verbose('miter', `Closing HTTP server...`);
        await wrapPromise((cb: Function) => {
            if (!this.webServer) return cb();
            (<any>this.webServer).close(cb);
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
            this.webServer = undefined;
            this.shutdown();
            break;
        case "EADDRINUSE":
            this.logger.error('miter', `${bind} is already in use`);
            this.errorCode = 1;
            this.webServer = undefined;
            this.shutdown();
            break;
        default:
            throw error;
        }
    }
    private onListening() {
        if (!this.webServer) throw new Error(`onListening called, but there is no httpServer!`);
        let addr = this.webServer.address();
        let bind = (typeof addr === "string") ? `pipe ${addr}` : `port ${addr.port}`;
        this.logger.info('miter', `Listening on ${bind}`);
    }
}
