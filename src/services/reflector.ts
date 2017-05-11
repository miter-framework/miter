import * as _ from 'lodash';

import { CtorT } from '../core/ctor';
import { ServiceT } from '../core/service';
import { Injector } from '../core/injector';
import { Injectable } from '../decorators/services/injectable.decorator';
import { Server } from '../server/server';
import { Logger } from '../services/logger';

@Injectable()
export class ServiceReflector {
    constructor(
        private injector: Injector
    ) {
        this.logger = injector.resolveInjectable(Logger)!;
    }
    
    private logger: Logger;
    
    private _startedServices: ServiceT[] = [];
    async reflectServices(services: CtorT<ServiceT>[]) {
        services = services || [];
        let failures = 0;
        for (let q = 0; q < services.length; q++) {
            let result = await this.reflectService(services[q]);
            if (!result) {
                this.logger.error('services', `Failed to start service: ${services[q].name || services[q]}`);
                failures++;
            }
        }
        
        if (!!failures) {
            this.logger.error('services', `${services.length - failures} services started correctly out of ${services.length}`);
            return false;
        }
        else {
            this.logger.info('services', `${services.length - failures} services started correctly out of ${services.length}`);
            return true;
        }
    }
    async reflectService(serviceFn: CtorT<ServiceT>): Promise<boolean> {
        let serviceName = serviceFn.name || serviceFn;
        try {
            let service = this.injector.resolveInjectable(serviceFn);
            if (typeof service === 'undefined') throw new Error(`Failed to inject service: ${serviceName}`);
            if (typeof service.start !== 'undefined') {
                let result = await service.start();
                if (typeof result === 'boolean' && !result) return false;
            }
            this._startedServices.push(service);
            return true;
        }
        catch (e) {
            this.logger.error('services', `Exception occurred when trying to start service: ${serviceName}`);
            this.logger.error('services', e);
            return false;
        }
    }
    
    async shutdownServices() {
        let services = this._startedServices;
        this._startedServices = [];
        let failures = 0;
        for (let q = 0; q < services.length; q++) {
            let result = await this.shutdownService(services[q]);
            if (!result) {
                this.logger.error('services', `Failed to stop service: ${services[q]}`);
                failures++;
            }
        }
        
        if (!!failures) {
            this.logger.error('services', `${services.length - failures} services terminated correctly out of ${services.length}`);
            return false;
        }
        else {
            this.logger.info('services', `${services.length - failures} services terminated correctly out of ${services.length}`);
            return true;
        }
    }
    async shutdownService(service: ServiceT): Promise<boolean> {
        let serviceName = `${service}`;
        try {
            if (typeof service.stop !== 'undefined') await service.stop();
            return true;
        }
        catch (e) {
            this.logger.error('services', `Exception occurred when trying to stop service: ${serviceName}`);
            this.logger.error('services', e);
            return false;
        }
    }
}
