import 'reflect-metadata';
import { CtorT } from './ctor';
import { Injectable } from '../decorators/services/injectable.decorator';
import { ProvideMetadata, ProvideMetadataClassSource, ProvideMetadataValueSource, ProvideMetadataCallbackSource,
         DependencySource, SimpleDependencySource } from '../metadata/server/provide';
import { MetadataMetadataSym } from '../metadata/services/metadata';
import { InjectableMetadata, InjectableMetadataSym } from '../metadata/services/injectable';
import { LoggerCore } from '../services/logger-core';
import { Logger } from '../services/logger';
import { clc } from '../util/clc';
import _ = require('lodash');

type MetaStackFrame = [CtorT<any>, Map<string, string> | undefined];

@Injectable()
export class Injector {
    constructor(private _loggerCore: LoggerCore) {
        this.cache.set(LoggerCore, () => this._loggerCore);
        this.cache.set(Injector, () => this);
        this.logger = Logger.fromSubsystem(this._loggerCore, 'injector');
    }
    
    private logger: Logger;
    
    private temporaryValue = Symbol.for('recursive-injection');
    private cache: Map<CtorT<any>, any> = new Map<CtorT<any>, any>();
    private metaStack: MetaStackFrame[] = [];
    private metaDefaults = new Map<string, any>();
    resolveInjectable<T>(ctorFn: CtorT<T>, resolveType?: string): T | undefined {
        if (!ctorFn) {
            throw new Error('Attempted to inject a falsey type.');
        }
        this.logger.verbose(`Resolving ${ctorFn.name || ctorFn}`);
        if (this.cache.get(ctorFn) === this.temporaryValue) {
            throw new Error(`Detected circular dependency. Recursive injection of type ${ctorFn.name || ctorFn}`);
        }
        
        if (!this.cache.has(ctorFn)) {
            let injectableMeta: InjectableMetadata<any> = Reflect.getOwnMetadata(InjectableMetadataSym, ctorFn.prototype) || {};
            let restriction = injectableMeta.restriction || 'none';
            if (restriction !== 'none' && resolveType !== restriction) {
                this.logger.warn(`Resolving ${this.stringifyDependency(ctorFn)} (a ${restriction} injectable) for the first time in a context that is not expecting a ${restriction}.`);
                if (restriction === 'service') this.logger.warn(`Did you add it to the list of services in Miter.launch?`);
                this.logger.warn(`Resolving as undefined instead of resolving the injectable.`);
                this.cache.set(ctorFn, () => undefined);
                return undefined;
            }
            if (injectableMeta.provide) {
                let source: any = injectableMeta.provide;
                source.provide = ctorFn;
                if (this.isClassSource(source) || this.isValueSource(source)) throw new Error(`Injectable metadata { provide: ... } can only be used to specify a callback function.`);
                this.provide(source);
            }
            else {
                this.cache.set(ctorFn, this.temporaryValue);
                let inst = this.construct(ctorFn);
                this.cache.set(ctorFn, () => inst);
                return inst;
            }
        }
        
        return this.cache.get(ctorFn)();
    }
    private construct<T>(ctorFn: CtorT<T>): T {
        let types: any[] = Reflect.getOwnMetadata('design:paramtypes', ctorFn);
        let values = this.resolveDependencies(types, ctorFn);
        return new ctorFn(...values);
    }
    private constructCallback<T>(provideMeta: ProvideMetadataCallbackSource<T>): { (): T } {
        let types = _.clone(provideMeta.deps);
        let ctor = provideMeta.provide;
        let name = `${ctor.name || ctor}`;
        let injecting = false;
        let invokeCallback = () => {
            if (injecting) {
                throw new Error(`Detected circular dependency. Recursive injection of type ${name}`);
            }
            injecting = true;
            let values = this.resolveDependencies(types, provideMeta.provide);
            let result = provideMeta.useCallback(...values);
            injecting = false;
            return result;
        }
        if (!provideMeta.cache) return invokeCallback;
        
        let cachedValue: T;
        let hasCachedValue = false;
        return () => {
            if (!hasCachedValue) {
                hasCachedValue = true;
                cachedValue = invokeCallback();
            }
            return cachedValue;
        };
    }
    private resolveDependencies(deps: DependencySource[] | undefined, ctor: CtorT<any>) {
        let map: Map<string, string> | undefined = Reflect.getOwnMetadata(MetadataMetadataSym, ctor.prototype);
        this.metaStack.push([ctor, map]);
        let len = this.metaStack.length;
        let failed = false;
        try {
            let name = `${(ctor && ctor.name) || ctor}`;
            if (!deps) deps = [];
            let types: SimpleDependencySource[] = deps.map(dep => this.getSimpleDependency(dep));
            let typesStr = `[${types.map(type => this.stringifyDependency(type)).join(', ')}]`;
            this.logger.verbose(`Constructing ${name} with types ${typesStr}`);
            for (let q = 0; q < types.length; q++) {
                let type = types[q];
                if (!type || type === Object || type === String) {
                    throw new Error(`Could not dependency inject ${name}. Failed to resolve dependencies. Reflected: ${typesStr}`);
                }
            }
            let values = types.map(type => this.resolveDependency(type));
            return values;
        }
        catch (e) {
            failed = true;
            throw e;
        }
        finally {
            if (len != this.metaStack.length) {
                if (!failed) throw new Error(`Metadata stack is the wrong size in Injector.resolveDependencies!`);
                else this.logger.error(`BIG PROBLEMS! Metadata stack is the wrong size in Injector.resolveDependencies! Throwing an exception would hide another one.`);
            }
            else this.metaStack.pop();
        }
    }
    private getSimpleDependency(dep: DependencySource): SimpleDependencySource {
        if (typeof dep === 'function' && !dep.prototype) {
            let result = (<() => SimpleDependencySource>dep)();
            return result;
        }
        return <SimpleDependencySource>dep;
    }
    private stringifyDependency(type: SimpleDependencySource) {
        if (typeof type === 'undefined') return 'undefined';
        if (typeof type === 'string') return `'${type}'`;
        return (type && type.name) || type;
    }
    private resolveDependency(type: SimpleDependencySource) {
        if (typeof type === 'string') return this.resolveMetadata(type);
        return this.resolveInjectable(type);
    }
    private resolveMetadata(name: string) {
        //Ignoring metadata on the most recent stack frame
        let metaFrame = (this.metaStack.length > 1 && this.metaStack[this.metaStack.length - 2]) || [<any>undefined, undefined];
        let [ctor, map] = metaFrame;
        if (map && map.has(name)) return map.get(name);
        if (ctor && name === 'name') return `${ctor.name || ctor}`;
        if (this.metaDefaults.has(name)) return this.metaDefaults.get(name);
        return undefined;
    }
    provide<T>(provideMeta: ProvideMetadata<any>): this {
        if (!provideMeta) throw new Error(`Invalid ProvideMetadata: ${provideMeta}`);
        let ctorFn = provideMeta.provide;
        if (!ctorFn) throw new Error('Attempted to provide a value for a falsey type.');
        if (this.cache.has(ctorFn)) throw new Error(`Duplicate value provided for ${ctorFn.name || ctorFn}.`);
        
        let tFn: { (): T };
        if (this.isClassSource(provideMeta)) {
            this.logger.verbose(`Providing ${ctorFn.name || ctorFn} using class ${provideMeta.useClass.name || provideMeta.useClass}`);
            let t = this.construct(provideMeta.useClass);
            tFn = () => t;
        }
        else if (this.isValueSource(provideMeta)) {
            this.logger.verbose(`Providing ${ctorFn.name || ctorFn} using value ${JSON.stringify(provideMeta.useValue)}`);
            let t = provideMeta.useValue;
            tFn = () => t;
        }
        else if (this.isCallbackSource(provideMeta)) {
            this.logger.verbose(`Providing ${ctorFn.name || ctorFn} using callback ${provideMeta.useCallback.name || provideMeta.useCallback}`);
            tFn = this.constructCallback(provideMeta);
        }
        else throw new Error(`Could not resolve dependency injection provider source.`);
        
        this.cache.set(ctorFn, tFn);
        return this;
    }
    provideMetadata(name: string, value: any) {
        if (this.metaDefaults.has(name)) throw new Error(`A value has already been provided for metadata '${name}'`);
        this.metaDefaults.set(name, value);
    }
    
    private isClassSource<T>(meta: ProvideMetadata<T>): meta is ProvideMetadataClassSource<T, any> {
        return !!(<ProvideMetadataClassSource<T, any>>meta).useClass;
    }
    private isValueSource<T>(meta: ProvideMetadata<T>): meta is ProvideMetadataValueSource<T> {
        return typeof (<ProvideMetadataValueSource<T>>meta).useValue !== 'undefined';
    }
    private isCallbackSource<T>(meta: ProvideMetadata<T>): meta is ProvideMetadataCallbackSource<T> {
        return !!(<ProvideMetadataCallbackSource<T>>meta).useCallback;
    }
}
