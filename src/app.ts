"use strict";

import * as express from 'express';
import * as http from 'http';
var debug = require("debug")("express:server");

export class Server {
   constructor() {
      this.app = express();
      this.config();
      this.routes();
   }
   
   public static bootstrap(): Server {
      return new Server();
   }
   
   public app: express.Application;
   
   config() {
      
   }
   
   routes() {
      let router: express.Router = express.Router();
      
      router.get('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
         res.send(`

<!doctype HTML>
<html>
   <head>
      <title>Title</title>
   </head>
   <body>
      Hello, World!
   </body>
</html>

         `);
      });
      
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
      debug("Listening on " + bind);
   }
}
