import 'reflect-metadata';
import { CtorT } from './ctor';
import { ProvideMetadata, ProvideMetadataClassSource, ProvideMetadataValueSource, ProvideMetadataCallbackSource } from '../metadata';
import { clc } from '../util/clc';

export class Injector {
    constructor() {
    }

    private temporaryValue = Symbol.for('recursive-injection');
    private cache: Map<CtorT<any>, any> = new Map<CtorT<any>, any>();
    resolveInjectable<T>(ctorFn: CtorT<T>): T | undefined {
        if (!ctorFn) {
            console.error(clc.error('Attempted to inject a falsey type.'));
            return;
        }
        if (this.cache.get(ctorFn) === this.temporaryValue) {
            console.error(clc.error(`Recursive injection of type ${ctorFn.name || ctorFn}`));
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
        if (!types) throw new Error(`Could not dependency inject ${ctorFn.name || ctorFn}. No design-time metadata could be reflected.`);
        let values = types.map(type => this.resolveInjectable(type));
        return new ctorFn(...values);
    }
    provide<T>(provideMeta: ProvideMetadata<any>): this {
        let ctorFn = provideMeta.provide;
        if (!ctorFn) throw new Error('Attempted to provide a value for a falsey type.');
        if (this.cache.has(ctorFn)) throw new Error(`Duplicate value provided for ${ctorFn.name || ctorFn}.`);
        
        let tFn: { (): T };
        if (this.isClassSource(provideMeta)) {
            console.log(clc.info(`Providing ${ctorFn.name || ctorFn} using class ${provideMeta.useClass.name || provideMeta.useClass}`));
            let t = this.construct(provideMeta.useClass);
            tFn = () => t;
        }
        else if (this.isValueSource(provideMeta)) {
            console.log(clc.info(`Providing ${ctorFn.name || ctorFn} using value ${provideMeta.useValue}`));
            let t = provideMeta.useValue;
            tFn = () => t;
        }
        else if (this.isCallbackSource(provideMeta)) {
            console.log(clc.info(`Providing ${ctorFn.name || ctorFn} using callback ${provideMeta.useCallback.name || provideMeta.useCallback}`));
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
        return !!(<ProvideMetadataValueSource<T>>meta).useValue;
    }
    private isCallbackSource<T>(meta: ProvideMetadata<T>): meta is ProvideMetadataCallbackSource<T> {
        return !!(<ProvideMetadataCallbackSource<T>>meta).useCallback;
    }
}
