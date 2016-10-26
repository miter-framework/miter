"use strict";

import * as express from 'express';
import * as http from 'http';
var debug = require("debug")("express:server");
import { Sequelize } from 'sequelize';

import { OrmReflector } from './orm/reflector';
import { RouterReflector } from './router/reflector';

export class Server {
   constructor() {
      this.app = express();
      
      console.log("Loading configuration...");
      this.config();
      
      console.log("Loading database configuration...");
      this.orm();
      
      console.log("Loading routes...");
      this.routes();
   }
   
   public static bootstrap(): Server {
      return new Server();
   }
   
   public app: express.Application;
   
   config() {
      
   }
   
   private ormReflector: OrmReflector;
   orm() {
      let sequelize: Sequelize;
      this.ormReflector = new OrmReflector(sequelize);
   }
   
   private routerReflector: RouterReflector;
   routes() {
      let router: express.Router = express.Router();
      this.routerReflector = new RouterReflector(router);
      this.app.use(router);
   }
   
   public port: number;
   private httpServer: http.Server;
   setPort(port: number) {
      this.app.set('port', this.port = port);
   }
   listen() {
      //create http server
      this.httpServer = http.createServer(this.app);
      
      //listen on provided ports
      this.httpServer.listen(this.port);
      this.httpServer.on("error", (err) => this.onError(err));
      this.httpServer.on("listening", () => this.onListening());
   }
   private onError(error) {
      if (error.syscall !== "listen") {
         throw error;
      }
      
      var bind = (typeof this.port === "string") ? `pipe ${this.port}` : `port ${this.port}`;
      
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
