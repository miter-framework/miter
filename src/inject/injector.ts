import "reflect-metadata";

type CtorT = { new (...any): any };

export class Injector {
   constructor() { }
   
   private temporaryValue = Symbol.for('recursive-injection');
   private cache: Map<Function, any> = new Map<Function, any>();
   resolveInjectable(ctorFn: CtorT) {
      if (!ctorFn) {
         console.error('Attempted to inject a falsey type.');
         return;
      }
      if (this.cache.get(ctorFn) === this.temporaryValue) {
         console.error(`Recursive injection of type ${ctorFn.name || ctorFn}`);
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
}
