import { ServerMetadata } from '../core/metadata';
import { Server } from './server';

export class Miter {
   public static launch(meta: ServerMetadata): Server {
      let serverInst = new Server(meta);
      serverInst.init();
      return serverInst;
   }
   
   public static normalizePort(val: any): string | number {
      var port = parseInt(val, 10);
      
      if (isNaN(port)) {
         // named pipe
         return val;
      }
      
      if (port >= 0) {
         // port number
         return port;
      }
      
      throw new Error(`Failed to normalize port: ${val}`);
   }
}
