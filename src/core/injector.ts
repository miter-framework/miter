import 'reflect-metadata';
import { CtorT } from './ctor';
import { Injectable } from '../decorators/services/injectable.decorator';
import { ProvideMetadata, ProvideMetadataClassSource, ProvideMetadataValueSource, ProvideMetadataCallbackSource } from '../metadata/server/provide';
import { Logger } from '../services/logger';
import { clc } from '../util/clc';

@Injectable()
export class Injector {
    constructor(private logger: Logger) {
        this.cache.set(Logger, () => this.logger);
        this.cache.set(Injector, () => this);
    }
    
    private temporaryValue = Symbol.for('recursive-injection');
    private cache: Map<CtorT<any>, any> = new Map<CtorT<any>, any>();
    resolveInjectable<T>(ctorFn: CtorT<T>): T | undefined {
        if (!ctorFn) {
            this.logger.error('injector', 'Attempted to inject a falsey type.');
            return;
        }
        this.logger.verbose('injector', `Resolving ${ctorFn.name || ctorFn}`);
        if (this.cache.get(ctorFn) === this.temporaryValue) {
            this.logger.error('injector', `Detected circular dependency. Recursive injection of type ${ctorFn.name || ctorFn}`);
            return;
        }
        if (this.cache.has(ctorFn)) {
            return this.cache.get(ctorFn)();
        }
        this.cache.set(ctorFn, this.temporaryValue);
        
        let inst = this.construct(ctorFn);
        this.cache.set(ctorFn, () => inst);
        return inst;
    }
    private construct<T>(ctorFn: CtorT<T>): T {
        let types: any[] = Reflect.getOwnMetadata('design:paramtypes', ctorFn);
        if (!types) types = [];
        let typesStr = `[${types.map(type => (type && type.name) || type).join(', ')}]`;
        this.logger.verbose('injector', `Constructing ${ctorFn.name || ctorFn} with types ${typesStr}`);
        if (types.find(type => type == Object)) throw new Error(`Could not dependency inject ${ctorFn.name || ctorFn}. Failed to resolve constructor types. Reflected: ${typesStr}`);
        let values = types.map(type => this.resolveInjectable(type));
        return new ctorFn(...values);
    }
    provide<T>(provideMeta: ProvideMetadata<any>): this {
        if (!provideMeta) throw new Error(`Invalid ProvideMetadata: ${provideMeta}`);
        let ctorFn = provideMeta.provide;
        if (!ctorFn) throw new Error('Attempted to provide a value for a falsey type.');
        if (this.cache.has(ctorFn)) throw new Error(`Duplicate value provided for ${ctorFn.name || ctorFn}.`);
        
        let tFn: { (): T };
        if (this.isClassSource(provideMeta)) {
            this.logger.verbose('injector', `Providing ${ctorFn.name || ctorFn} using class ${provideMeta.useClass.name || provideMeta.useClass}`);
            let t = this.construct(provideMeta.useClass);
            tFn = () => t;
        }
        else if (this.isValueSource(provideMeta)) {
            this.logger.verbose('injector', `Providing ${ctorFn.name || ctorFn} using value ${JSON.stringify(provideMeta.useValue)}`);
            let t = provideMeta.useValue;
            tFn = () => t;
        }
        else if (this.isCallbackSource(provideMeta)) {
            this.logger.verbose('injector', `Providing ${ctorFn.name || ctorFn} using callback ${provideMeta.useCallback.name || provideMeta.useCallback}`);
            tFn = provideMeta.useCallback;
        }
        else throw new Error(`Could not resolve dependency injection provider source.`);
        
        this.cache.set(ctorFn, tFn);
        return this;
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
