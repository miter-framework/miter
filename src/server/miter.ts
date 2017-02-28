import { ServerMetadata } from '../metadata/server/server';
import { Server } from './server';

export class Miter {
    public static async launch(meta: ServerMetadata): Promise<Server> {
        if (!meta.debugBreakpoint)
            meta.debugBreakpoint = () => {};
        (<any>global)['debugBreakpoint'] = meta.debugBreakpoint;
        
        let serverInst = new Server(meta);
        let initPromise = serverInst.init();
        process.on('SIGINT', async () => {
            serverInst.logger.error('miter', `Received SIGINT kill signal...`);
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
        let port = parseInt(val, 10);
        
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
