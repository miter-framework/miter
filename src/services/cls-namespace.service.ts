import { createNamespace, Namespace, Context } from 'continuation-local-storage';
import { ServerMetadata } from '../metadata/server/server';
import { Service } from '../decorators/services/service.decorator';

@Service()
export class ClsNamespaceService implements Namespace {
    constructor(private meta: ServerMetadata) {
        let _name = `miter-cls-(${meta.name || ''})-${ClsNamespaceService.namespaceNum++}`;
        this._namespace = createNamespace(_name);
    }
    
    private static namespaceNum: number = 0;
    private _namespace: Namespace;
    
    get name() {
        return this._namespace.name;
    }
    
    get activeContext() {
        return this.active;
    }
    get active() {
        return this._namespace.active;
    }
    createContext() {
        return this._namespace.createContext();
    }
    
    get(key: string) {
        return this._namespace.get(key);
    }
    set<T>(key: string, val: T) {
        this._namespace.set(key, val);
    }
    
    run(callback: <T>(...args: any[]) => T) {
        return this._namespace.run(callback);
    }
    runAndReturn<T>(callback: (...args: any[]) => T) {
        return this._namespace.runAndReturn(callback);
    }
    bind(callback: any, context?: Context) {
        return this._namespace.bind(callback, context);
    }
    bindEmitter(emitter: NodeJS.EventEmitter) {
        return this._namespace.bindEmitter(emitter);
    }
}
