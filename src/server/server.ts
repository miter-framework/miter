"use strict";

import * as createExpressApp from 'express';
import { Request, Response, Application as ExpressApp } from 'express';
import * as bodyParser from 'body-parser';
import { Injector } from '../core/injector';
import { Injectable } from '../decorators/services/injectable.decorator';
import { ServerMetadataT, ServerMetadata } from '../metadata/server/server';
import { OrmReflector } from '../orm/reflector';
import { ServiceReflector } from '../services/reflector';
import { LoggerCore } from '../services/logger-core';
import { TemplateService } from '../services/template.service';
import { RouterReflector } from '../router/reflector';
import { wrapPromise } from '../util/wrap-promise';
import { wrapCallback } from '../util/wrap-callback';
import { monkeypatchRequest } from './static-middleware';

import * as http from 'http';
import * as https from 'https';
import debug_module = require('debug');
let debug = debug_module('express:server');

@Injectable()
export class Server {
    constructor(meta: ServerMetadataT) {
        this._loggerCore = new LoggerCore(meta.name || null, meta.logLevel);
        this._injector = new Injector(this._loggerCore);
        this._injector.provide({ provide: Server, useValue: this });
        this._meta = new ServerMetadata(meta, this._injector);
        for (let q = 0; q < this.meta.inject.length; q++) {
            this._injector.provide(this.meta.inject[q]);
        }
        if (!this._meta.router) this._injector.provide({ provide: RouterReflector, useValue: null });
    }
    
    private _meta: ServerMetadata;
    get meta() {
        return this._meta;
    }
    
    private _loggerCore: LoggerCore;
    private get logger() {
        return this._loggerCore.getSubsystem('miter');
    }
    // get logger(): Logger {
    //     return this._logger;
    // }
    
    private _app: ExpressApp;
    get app(): ExpressApp {
        return this._app;
    }
    
    private _injector: Injector;
    get injector(): Injector {
        return this._injector;
    }
    
    init() {
        this.initPromise = this.initImpl();
        process.on('SIGINT', this.onSIGINT.bind(this));
        return this.initPromise;
    }
    async initImpl() {
        this.startTime = new Date();
        
        try {
            this.logger.info(`Initializing miter server...`);
            if (this.meta.router) await this.createExpressApp();
            await this.reflectOrm();
            await this.startServices();
            if (this.meta.router) this.reflectRoutes();
        }
        catch (e) {
            this.logger.error(`FATAL ERROR: Failed to launch server.`);
            this.logger.error(e);
            return;
        }
        
        if (this.meta.router) this.listen();
    }
    private initPromise: Promise<void>;
    startTime: Date | null = null;
    
    errorCode: number = 0;
    private async onSIGINT() {
        this.logger.error(`Received SIGINT kill signal...`);
        try {
            await this.initPromise; //Wait for initialization before we try to shut down the server
            await this.shutdown();
        }
        finally {
            process.exit(this.errorCode);
        }
    }
    async shutdown() {
        try {
            try {
                this.logger.info(`Shutting down miter server...`);
                if (this.meta.router) await this.stopListening();
                await this.stopServices();
            }
            finally {
                this._loggerCore.shutdown();
            }
        }
        catch (e) {
            this.logger.error(`FATAL ERROR: Failed to gracefully shutdown server.`);
            this.logger.error(e);
        }
    }
    
    createExpressApp() {
        this._app = createExpressApp();
        this._app.use(bodyParser.urlencoded({ extended: true }), bodyParser.json());
        if (this.meta.allowCrossOrigin) {
            this.logger.warn(`Server starting with cross-origin policy enabled. This should not be enabled in production.`);
            this._app.use(function(req: Request, res: Response, next) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
                next();
            });
        }
        this._app.use(monkeypatchRequest);
        if (this.meta.router && this.meta.router.middleware && this.meta.router.middleware.length) {
            this._app.use(...this.meta.router.middleware);
        }
        if (this.meta.views) {
            let viewsMeta = this.meta.views;
            if (viewsMeta.fileRoot) this._app.set('views', viewsMeta.fileRoot);
            if (typeof viewsMeta.engine === 'string') this._app.set('view engine', viewsMeta.engine);
            else if (viewsMeta.engine) {
                this._app.set('view engine', 'miter');
                this.injector.provide({
                    provide: TemplateService,
                    useClass: viewsMeta.engine
                });
            }
            this._app.engine('miter', wrapCallback(async (path: string, opts: any) => {
                let templateService = this.injector.resolveInjectable(TemplateService);
                if (!templateService) throw new Error(`Cannot render using the miter view engine. No TemplateService provided`);
                return await templateService.render(path, opts);
            }));
        }
    }
    
    private ormReflector: OrmReflector;
    async reflectOrm() {
        let orm = this.meta.orm;
        if (orm && (typeof orm.enabled === 'undefined' || orm.enabled) && orm.db) {
            this.ormReflector = this._injector.resolveInjectable(OrmReflector)!;
            await this.ormReflector.init();
        }
        else if (this.meta.orm.models.length) {
            this.logger.warn(`Models included in server metadata, but no orm configuration defined.`);
        }
    }
    
    private serviceReflector: ServiceReflector;
    private async startServices() {
        this.serviceReflector = this._injector.resolveInjectable(ServiceReflector)!;
        await this.serviceReflector.startServices();
    }
    private async stopServices() {
        await this.serviceReflector.shutdownServices();
    }
    
    private routerReflector: RouterReflector;
    private reflectRoutes() {
        this.routerReflector = this._injector.resolveInjectable(RouterReflector)!;
        this.routerReflector.reflectServerRoutes(this.app);
    }
    
    private webServer: http.Server | https.Server| undefined;
    private listen() {
        this.logger.info(`Serving`);
        
        if (this.meta.ssl.enabled) {
            this.webServer = https.createServer({key: this._meta.ssl.privateKey, cert: this._meta.ssl.certificate}, this.app);
        }
        else {
            this.webServer = http.createServer(this.app);
        }
        this.webServer.listen(this.meta.port, () => this.onListening());
        this.webServer.on("error", (err: any) => this.onError(err));
    }
    private async stopListening() {
        this.logger.verbose(`Closing HTTP server...`);
        await wrapPromise((cb: Function) => {
            if (!this.webServer) return cb();
            (<any>this.webServer).close(cb);
        });
        this.logger.info(`Finished closing HTTP server.`);
    }
    private onError(error: Error & { syscall?: string, code?: string }) {
        if (error.syscall !== "listen") {
            throw error;
        }
        
        let bind = (typeof this.meta.port === "string") ? `pipe ${this.meta.port}` : `port ${this.meta.port}`;
        
        // handle specific listen errors with friendly messages
        switch (error.code) {
        case "EACCES":
            this.logger.error(`${bind} requires elevated privileges`);
            this.errorCode = 1;
            this.webServer = undefined;
            this.shutdown();
            break;
        case "EADDRINUSE":
            this.logger.error(`${bind} is already in use`);
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
        this.logger.info(`Listening on ${bind}`);
    }
}
