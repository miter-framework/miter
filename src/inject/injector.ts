import "reflect-metadata";

export class Injector {
   constructor() { }
   
   private temporaryValue = Symbol.for('recursive-injection');
   private cache: any = {};
   resolveInjectable(ctorFn: any) {
      if (!ctorFn) {
         console.error('Attempted to inject a falsey type.');
         return;
      }
      if (this.cache[ctorFn] === this.temporaryValue) {
         console.error(`Recursive injection of type ${ctorFn.name || ctorFn}`);
         return;
      }
      if (typeof this.cache[ctorFn] !== 'undefined') {
         return this.cache[ctorFn];
      }
      this.cache[ctorFn] = this.temporaryValue;
      
      let types: any[] = Reflect.getOwnMetadata('design:paramtypes', ctorFn);
      let values = types.map(type => this.resolveInjectable(type));
      
      return this.cache[ctorFn] = new ctorFn(...values);
   }
}
