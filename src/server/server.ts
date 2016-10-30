"use strict";

import * as express from 'express';

import { Injector } from '../core';
import { ServerMetadata } from '../core/metadata';
import { OrmReflector } from '../orm';
import { ServiceReflector } from '../services';
import { RouterReflector } from '../router';

import * as http from 'http';
var debug = require("debug")("express:server");

export class Server {
   constructor(private _meta: ServerMetadata) {
      this._injector = new Injector();
      this._injector.provide(Server, this);
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
         console.log("Initializing api-server...");
         this._app = express();
         
         console.log("  Loading database configuration...");
         await this.reflectOrm();
         
         console.log("  Starting services...");
         await this.startServices();
         
         console.log("  Loading routes...");
         this.reflectRoutes();
      }
      catch (e) {
         console.error("FATAL ERROR: Failed to launch server.");
         console.error(`${e}`);
         return;
      }
      
      console.log("Serving");
      this.listen();
   }
   
   private ormReflector: OrmReflector;
   async reflectOrm() {
      this.ormReflector = new OrmReflector(this);
      await this.ormReflector.init();
   }
   
   private serviceReflector: ServiceReflector;
   async startServices() {
      this.serviceReflector = new ServiceReflector(this);
      await this.serviceReflector.reflectServices(this.meta.services || []);
   }
   
   private routerReflector: RouterReflector;
   reflectRoutes() {
      let router = express.Router();
      this.routerReflector = new RouterReflector(this, router);
      this.routerReflector.reflectRoutes(this.meta.controllers || []);
      this.app.use(router);
   }
   
   private httpServer: http.Server;
   listen() {
      //create http server
      this.httpServer = http.createServer(this.app);
      
      //listen on provided ports
      this.httpServer.on("error", (err) => this.onError(err));
      this.httpServer.on("listening", () => this.onListening());
      this.httpServer.listen(this.meta.port);
   }
   private onError(error) {
      if (error.syscall !== "listen") {
         throw error;
      }
      
      var bind = (typeof this.meta.port === "string") ? `pipe ${this.meta.port}` : `port ${this.meta.port}`;
      
      // handle specific listen errors with friendly messages
      switch (error.code) {
      case "EACCES":
         console.error(`${bind} requires elevated privileges`);
         process.exit(1);
         break;
      case "EADDRINUSE":
         console.error(`${bind} is already in use`);
         process.exit(1);
         break;
      default:
         throw error;
      }
   }
   private onListening() {
      var addr = this.httpServer.address();
      var bind = (typeof addr === "string") ? `pipe ${addr}` : `port ${addr.port}`;
      debug(`Listening on ${bind}`);
   }
}
