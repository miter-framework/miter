import { ServerMetadata } from '../metadata';
import { Server } from './server';
import { clc } from '../util/clc';

export class Miter {
   public static async launch(meta: ServerMetadata): Promise<Server> {
      let serverInst = new Server(meta);
      let initPromise = serverInst.init();
      process.on('SIGINT', async () => {
         console.log(clc.error(`Received SIGINT kill signal...`));
         try {
            await initPromise; //Wait for initialization before we try to shut down the server
            await serverInst.shutdown();
         }
         finally {
            process.exit(serverInst.errorCode);
         }
      });
      await initPromise;
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
