"use strict";

import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Injector } from '../core';
import { ServerMetadata } from '../core/metadata';
import { OrmReflector } from '../orm';
import { ServiceReflector } from '../services';
import { RouterReflector } from '../router';
import { wrapPromise } from '../util/wrap-promise';
import { clc } from '../util/clc';

import * as http from 'http';
var debug = require("debug")("express:server");

export class Server {
   constructor(private _meta: ServerMetadata) {
      this._injector = new Injector();
      this._injector.provide({provide: Server, useValue: this});
      if (_meta.inject) {
         for (var q = 0; q < _meta.inject.length; q++) {
            this._injector.provide(_meta.inject[q]);
         }
      }
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
         console.log(clc.info("Initializing miter server..."));
         await this.createExpressApp();
         await this.reflectOrm();
         await this.startServices();
         this.reflectRoutes();
      }
      catch (e) {
         console.error(clc.error("FATAL ERROR: Failed to launch server."));
         console.error(e);
         return;
      }
      
      this.listen();
   }
   errorCode: number = 0;
   async shutdown() {
      try {
         console.log(clc.info(`Shutting down miter server...`));
         await this.stopListening();
         await this.stopServices();
      }
      catch (e) {
         console.error(clc.error("FATAL ERROR: Failed to gracefully shutdown server."));
         console.error(e);
      }
   }
   
   createExpressApp() {
      this._app = express();
      this._app.use(bodyParser.urlencoded({ extended: true }), bodyParser.json());
      if (this.meta.allowCrossOrigin) {
         console.log(clc.warn(`  Warning: server starting with cross-origin policy enabled. This should not be enabled in production.`));
         this._app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");
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
         console.log("  Loading database configuration...");
         this.ormReflector = new OrmReflector(this);
         await this.ormReflector.init();
      }
      else if (this.meta.models && this.meta.models.length) {
         console.log(clc.warn("  Warning: Models included in server metadata, but no orm configuration defined."));
      }
   }
   
   private serviceReflector: ServiceReflector;
   private async startServices() {
      console.log("  Starting services...");
      this.serviceReflector = new ServiceReflector(this);
      await this.serviceReflector.reflectServices(this.meta.services || []);
   }
   private async stopServices() {
      console.log("  Shutting down services...");
      await this.serviceReflector.shutdownServices();
   }
   
   private routerReflector: RouterReflector;
   private reflectRoutes() {
      console.log("  Loading routes...");
      let router = express.Router();
      this.routerReflector = new RouterReflector(this, router);
      this.routerReflector.reflectRoutes(this.meta.controllers || []);
      this.app.use(router);
   }
   
   private httpServer: http.Server | undefined;
   private listen() {
      console.log(clc.info("Serving"));
      
      //create http server
      this.httpServer = http.createServer(this.app);
      
      //listen on provided ports
      this.httpServer.on("error", (err) => this.onError(err));
      // this.httpServer.on("listening", () => this.onListening());
      this.httpServer.listen(this.meta.port, () => this.onListening());
   }
   private async stopListening() {
      console.log("  Closing http server...");
      await wrapPromise((cb) => {
         if (!this.httpServer) return cb();
         this.httpServer.close(cb);
      });
   }
   private onError(error) {
      if (error.syscall !== "listen") {
         throw error;
      }
      
      var bind = (typeof this.meta.port === "string") ? `pipe ${this.meta.port}` : `port ${this.meta.port}`;
      
      // handle specific listen errors with friendly messages
      switch (error.code) {
      case "EACCES":
         console.error(clc.error(`${bind} requires elevated privileges`));
         this.errorCode = 1;
         this.httpServer = undefined;
         this.shutdown();
         break;
      case "EADDRINUSE":
         console.error(clc.error(`${bind} is already in use`));
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
      debug(clc.info(`Listening on ${bind}`));
   }
}
