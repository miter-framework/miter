import { CtorT, ServiceT } from '../core';
import { Server } from '../server';

export class ServiceReflector {
   constructor(private server: Server) {
   }
   
   async reflectServices(services: CtorT<ServiceT>[]) {
      let failures = 0;
      for (var q = 0; q < services.length; q++) {
         let result: boolean;
         try {
            result = await this.reflectService(services[q]);
         }
         catch (e) {
            console.error(`Exception occurred when trying to start service: ${services[q].name || services[q]}`);
            console.error(e);
            result = false;
         }
         if (!result) {
            console.error(`    Failed to start service: ${services[q].name || services[q]}`);
            failures++;
         }
      }
      
      console.log(`    ${services.length - failures} services started correctly out of ${services.length}`);
   }
   
   async reflectService(serviceFn: CtorT<ServiceT>): Promise<boolean> {
      let service = this.server.injector.resolveInjectable(serviceFn);
      if (typeof service === 'undefined') throw new Error(`Failed to inject service: ${serviceFn.name || serviceFn}`);
      if (typeof service.start !== 'undefined') {
         let result = await service.start();
         if (typeof result === 'boolean' && result === false) return false;
      }
      return true;
   }
}
