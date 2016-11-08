import 'reflect-metadata';
import { CtorT } from './ctor';
import { clc } from '../util/clc';

export class Injector {
   constructor() { }
   
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
         return this.cache.get(ctorFn);
      }
      this.cache.set(ctorFn, this.temporaryValue);
      
      let types: any[] = Reflect.getOwnMetadata('design:paramtypes', ctorFn);
      let values = types.map(type => this.resolveInjectable(type));
      
      var inst = new ctorFn(...values);
      this.cache.set(ctorFn, inst);
      return inst;
   }
   provide<T>(ctorFn: CtorT<T>, t: T): this {
      if (!ctorFn) throw new Error('Attempted to provide a value for a falsey type.');
      if (this.cache.has(ctorFn)) throw new Error(`Duplicate value provided for ${ctorFn.name || ctorFn}.`);
      this.cache.set(ctorFn, t);
      return this;
   }
}
