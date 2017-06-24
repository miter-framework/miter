import { ServerMetadataT, LogLevel } from '../metadata/server/server';
import { Task, TaskMetadataT } from '../metadata/server/task';
import { Server } from './server';
import { Service } from '../decorators/services/service.decorator';

export class Miter {
    public static async launch(meta: ServerMetadataT): Promise<Server> {
        let serverInst = new Server(meta);
        await serverInst.init();
        return serverInst;
    }
    
    public static task(meta: Task | TaskMetadataT): (...args: string[]) => Promise<void> {
        return async (...args: string[]) => {
            let metaFn = (typeof meta === 'function' ? meta : meta.task);
            let launchMeta: ServerMetadataT = <any>(typeof meta === 'function' ? {} : meta);
            
            delete (launchMeta as any).task;
            delete launchMeta.port;
            delete launchMeta.jwt;
            delete launchMeta.router;
            delete launchMeta.allowCrossOrigin;
            
            if (!launchMeta.logLevel) launchMeta.logLevel = 'warn';
            else if (typeof launchMeta.logLevel !== 'string' && !launchMeta.logLevel['default']) {
                launchMeta.logLevel['default'] = 'warn';
            }
            
            @Service()
            class TaskService {
                constructor(private server: Server) { }
                
                async start(): Promise<void> {
                    await metaFn(this.server, ...args);
                }
            }
            if (!launchMeta.services) launchMeta.services = [];
            launchMeta.services.push(TaskService);
            
            let serverInst = await Miter.launch(launchMeta);
            try {
                await serverInst.shutdown();
            }
            finally {
                process.exit(serverInst.errorCode);
            }
        };
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
