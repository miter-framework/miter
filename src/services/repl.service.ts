import { Service } from '../decorators/services/service.decorator';
import { Server } from '../server/server';
import { Logger } from './logger';
import { cin } from '../util/cin';
import { cout } from '../util/cout';
import vm = require('vm');

const ELLIPSIS_CHANGE_MILLIS = 50;

@Service()
export class ReplService {
    constructor(private server: Server) {
    }
    
    get logger() {
        return this.server.logger;
    }
    
    private context: vm.Context;
    private loopPromise: Promise<void>;
    
    async start() {
        this.makeContext();        
        this.loopPromise = this.repl();
    }
    
    private proxyModel(model: any) {
        let proxy_handler = {
            get: (target: any, name: string, receiver: any) => {
                if (!(name in target) && (name in target.db)) {
                    this.logger.warn('repl', `${name} is not a property on ${target.name || target}. Forwarding call to ${target.name || target}.db`);
                    let value = target.db[name];
                    if (typeof value === 'function') value = value.bind(target.db);
                    return value;
                }
                return target[name];
            }
        };
        let proxy = new Proxy(model, proxy_handler);
        proxy.toString = Function.prototype.toString.bind(model);
        return proxy;
    }
    private makeContext() {
        this.context = vm.createContext();
        let models = this.server.meta.orm.models;
        if (models) {
            for (let q = 0; q < models.length; q++) {
                (<any>this.context)[models[q].name] = this.proxyModel(models[q]);
            }
        }
        let services = this.server.meta.services;
        if (services) {
            for (let q = 0; q < services.length; q++) {
                (<any>this.context)[services[q].name] = this.server.injector.resolveInjectable(services[q]);
            }
        }
        (<any>this.context)['Server'] = this.server;
        (<any>this.context)['Injector'] = this.server.injector;
        (<any>this.context)['logger'] = this.server.logger;
        (<any>this.context)['delay'] = this.delay;
    }
    private delay(millis: number) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, millis);
        });
    }
    private async resolvePromise(promise: Promise<any>) {
        cin.pause();
        let resolved = false, error = false;
        let result: any;
        promise.then(val => {
            resolved = true;
            result = val;
        }, err => {
            error = true;
            result = err;
        });
        let ticks = 0;
        while (!resolved && !error) {
            // tslint:disable:no-magic-numbers
            let dots = (ticks / 5) % 4;
            let line = `Resolving${'.'.repeat(dots)}`;
            cout.write(line);
            await this.delay(ELLIPSIS_CHANGE_MILLIS);
            cout.clearLine();
            cout.moveCursor(-line.length, 0);
            ticks++;
        }
        cin.resume();
        if (error) throw result;
        return result;
    }
    private async execute(code: string) {
        try {
            let script = new vm.Script(code);
            let result = script.runInContext(this.context);
            if (result && result.then) result = await this.resolvePromise(result);
            console.log(result);
        }
        catch (e) {
            this.logger.error('repl', e && (e.message || e));
        }
    }
    
    private async repl() {
        while (true) {
            let line = await cin.readline();
            if (line == 'exit') break;
            await this.execute(line);
        }
    }
    
    async stop() {
        cin.emit('exit');
        await this.loopPromise;
    }
}
