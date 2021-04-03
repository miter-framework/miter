import * as createExpressApp from 'express';
import { Request, Response, Application as ExpressApp } from 'express';
import * as bodyParser from 'body-parser';
import { Injector } from '../core/injector';
import { Injectable } from '../decorators/services/injectable.decorator';

import { ServerMetadataT } from '../metadata/server/server-t';

import { ServerMetadata } from '../metadata/server/server';
import { RouterMetadata } from '../metadata/server/router';
import { ViewsMetadata } from '../metadata/server/views';
import { OrmMetadata } from '../metadata/server/orm';
import { SSLMetadata } from '../metadata/server/ssl';
import { DatabaseMetadata } from '../metadata/server/database';

import { ServiceReflector } from '../services/reflector';
import { LoggerCore } from '../services/logger-core';
import { ORMService } from '../services/orm.service';
import { TransactionService } from '../services/transaction.service';
import { TemplateService } from '../services/template.service';
import { RouterReflector } from '../router/reflector';
import { wrapPromise } from '../util/wrap-promise';
import { wrapCallback } from '../util/wrap-callback';
import { getMiterVersion } from '../util/get-miter-version';
import { monkeypatchResponseSendFile, monkeypatchResponseRender } from './static-middleware';

import * as http from 'http';
import * as https from 'https';
import debug_module = require('debug');
let debug = debug_module('express:server');

@Injectable()
export class Server {
  constructor(private _origMeta: ServerMetadataT) {
    this._loggerCore = new LoggerCore(_origMeta.name || null, _origMeta.logLevel);
    this._injector = new Injector(this._loggerCore);
    this._injector.provide({ provide: Server, useValue: this });
    this._injector.provideMetadata('server-meta', _origMeta);

    let meta: ServerMetadata;
    meta = this._injector.resolveInjectable(ServerMetadata)!;
    for (let q = 0; q < meta.inject.length; q++) {
      this._injector.provide(meta.inject[q]);
    }
  }

  get originalMeta() {
    return this._origMeta;
  }

  private _loggerCore: LoggerCore;
  private get logger() {
    return this._loggerCore.getSubsystem('miter');
  }
  // get logger(): Logger {
  //   return this._logger;
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
      this.logger.info(`Initializing miter server. (Miter version ${getMiterVersion()})`);

      let routerMeta = this.injector.resolveInjectable(RouterMetadata)!;
      if (routerMeta) await this.createExpressApp();
      this.serviceReflector = this._injector.resolveInjectable(ServiceReflector)!;
      await this.initOrm();
      await this.startServices();
      if (routerMeta) {
        this.reflectRoutes();
        await this.listen();
      }
    }
    catch (e) {
      this.logger.error(`FATAL ERROR: Failed to launch server.`);
      this.logger.error(e);
      return;
    }
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
    let shutdownSuccessful = true;
    try {
      try {
        this.logger.info(`Shutting down miter server...`);
        let routerMeta = this.injector.resolveInjectable(RouterMetadata)!;
        if (routerMeta) await this.stopListening();
        await this.stopServices();
      }
      finally {
        this._loggerCore.shutdown();
      }
    }
    catch (e) {
      this.logger.error(`FATAL ERROR: Failed to gracefully shutdown server.`);
      this.logger.error(e);
      shutdownSuccessful = false;
    }
    if (shutdownSuccessful) this.logger.info(`Miter server shut down successfully.`);
  }

  createExpressApp() {
    this._app = createExpressApp();
    this._app.use(bodyParser.urlencoded({ extended: true }), bodyParser.json());

    let meta = this.injector.resolveInjectable(ServerMetadata)!;
    let routerMeta = this.injector.resolveInjectable(RouterMetadata)!;
    let viewsMeta = this.injector.resolveInjectable(ViewsMetadata)!;

    if (meta.allowCrossOrigin) {
      this.logger.warn(`Server starting with cross-origin policy enabled. This should not be enabled in production.`);
      this._app.use(function(req: Request, res: Response, next: Function) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
        next();
      });
    }
    this._app.use(monkeypatchResponseSendFile);
    if (routerMeta && routerMeta.middleware && routerMeta.middleware.length) {
      this._app.use(...routerMeta.middleware);
    }
    if (viewsMeta) {
      if (viewsMeta.fileRoot) this._app.set('views', viewsMeta.fileRoot);
      if (typeof viewsMeta.engine === 'string') this._app.set('view engine', viewsMeta.engine);
      else if (viewsMeta.engine) {
        this.injector.provide({
          provide: TemplateService,
          useClass: viewsMeta.engine
        });
        this._app.use(monkeypatchResponseRender(this.injector, this._app));
      }
    }
  }

  private serviceReflector: ServiceReflector;

  async initOrm() {
    let ormMeta = this.injector.resolveInjectable(OrmMetadata)!;
    let dbMeta = this.injector.resolveInjectable(DatabaseMetadata)!;
    if (ormMeta && ((typeof ormMeta.enabled === 'undefined' && !!ormMeta.models.length) || ormMeta.enabled) && dbMeta) {
      this.serviceReflector.reflectServices([ORMService, TransactionService]);
    }
    else if (ormMeta.models.length) {
      this.logger.warn(`Models included in server metadata, but no orm configuration defined.`);
    }
  }

  private async startServices() {
    this.serviceReflector.reflectServices();
    await this.serviceReflector.startServices();
  }
  private async listenServices() {
    if (!this.webServer) throw new Error(`onListening called, but there is no httpServer!`);
    await this.serviceReflector.listenServices(this.webServer);
  }
  private async stopServices() {
    await this.serviceReflector.shutdownServices();
  }

  private routerReflector: RouterReflector;
  private reflectRoutes() {
    this.routerReflector = this._injector.resolveInjectable(RouterReflector)!;
    this.routerReflector.reflectServerRoutes(this.app);
  }

  private webServer: http.Server | https.Server | undefined;
  private listen(): Promise<void> {
    this.logger.info(`Serving`);

    let meta = this.injector.resolveInjectable(ServerMetadata)!;
    let sslMeta = this.injector.resolveInjectable(SSLMetadata)!;

    return new Promise<void>((resolve, reject) => {
      let isResolved = false;

      try {
        if (sslMeta.enabled) {
          this.webServer = https.createServer({key: sslMeta.privateKey, cert: sslMeta.certificate}, this.app);
        }
        else {
          this.webServer = http.createServer(this.app);
        }

        this.webServer.listen(meta.port, async () => {
          if (isResolved) return;
          isResolved = true;
          await this.onListening();
          resolve();
        });
        this.webServer.on("error", async (err: any) => {
          await this.onError(err);
          if (!isResolved) {
            isResolved = true;
            reject(err);
          }
        });
      }
      catch (e) {
        if (isResolved) throw e;
        isResolved = true;
        reject(e);
      }
    });
  }
  private async stopListening() {
    this.logger.verbose(`Closing HTTP server...`);
    await wrapPromise((cb: Function) => {
      if (!this.webServer) return cb();
      (<any>this.webServer).close(cb);
    });
    this.logger.info(`Finished closing HTTP server.`);
  }
  private async onError(error: Error & { syscall?: string, code?: string }) {
    if (error.syscall !== "listen") {
      throw error;
    }

    let meta = this.injector.resolveInjectable(ServerMetadata)!;

    let bind = (typeof meta.port === "string") ? `pipe ${meta.port}` : `port ${meta.port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case "EACCES":
      this.logger.error(`${bind} requires elevated privileges`);
      break;
    case "EADDRINUSE":
      this.logger.error(`${bind} is already in use`);
      break;
    default:
      this.logger.error(`An unknown error occurred in the http server.`);
      this.logger.error(error);
    }

    this.errorCode = 1;
    this.webServer = undefined;
    await this.shutdown();
    throw error;
  }
  private async onListening() {
    if (!this.webServer) throw new Error(`onListening called, but there is no httpServer!`);
    let addr = this.webServer.address();
    let bind = (typeof addr === "string") ? `pipe ${addr}` : `port ${addr.port}`;
    this.logger.info(`Listening on ${bind}`);
    await this.listenServices();
  }
}
