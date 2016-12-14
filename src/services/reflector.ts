import * as _ from 'lodash';

import { CtorT, ServiceT } from '../core';
import { Server } from '../server';
import { Logger } from '../services';

export class ServiceReflector {
    constructor(private server: Server) {
    }
    
    get logger() {
        return this.server.logger;
    }
    
    async reflectServices(services: CtorT<ServiceT>[]) {
        let failures = 0;
        for (var q = 0; q < services.length; q++) {
            let result: boolean;
            try {
                result = await this.reflectService(services[q]);
            }
            catch (e) {
                this.logger.error('services', `Exception occurred when trying to start service: ${services[q].name || services[q]}`);
                this.logger.error('services', e);
                result = false;
            }
            if (!result) {
                this.logger.error('services', `Failed to start service: ${services[q].name || services[q]}`);
                failures++;
            }
        }
        
        if (!!failures) this.logger.error('services', `${services.length - failures} services started correctly out of ${services.length}`);
        else this.logger.info('services', `${services.length - failures} services started correctly out of ${services.length}`);
    }
    
    private _startedServices: ServiceT[] = [];
    async reflectService(serviceFn: CtorT<ServiceT>): Promise<boolean> {
        let service = this.server.injector.resolveInjectable(serviceFn);
        if (typeof service === 'undefined') throw new Error(`Failed to inject service: ${serviceFn.name || serviceFn}`);
        this._startedServices.push(service);
        if (typeof service.start !== 'undefined') {
            let result = await service.start();
            if (typeof result === 'boolean' && !result) return false;
        }
        return true;
    }
    
    async shutdownServices() {
        let services = this._startedServices;
        this._startedServices = [];
        let failures = 0;
        for (var q = 0; q < services.length; q++) {
            let result: boolean;
            try {
                result = await this.shutdownService(services[q]);
            }
            catch (e) {
                this.logger.error('services', `Exception occurred when trying to stop service: ${services[q]}`);
                this.logger.error('services', e);
                result = false;
            }
            if (!result) {
                this.logger.error('services', `Failed to start service: ${services[q]}`);
                failures++;
            }
        }
        
        if (!!failures) this.logger.error('services', `${services.length - failures} services terminated correctly out of ${services.length}`);
        else this.logger.info('services', `${services.length - failures} services terminated correctly out of ${services.length}`);
    }
    async shutdownService(service: ServiceT): Promise<boolean> {
        if (typeof service.stop !== 'undefined') {
            let result = await service.stop();
            if (typeof result === 'boolean' && !result) return false;
        }
        return true;
    }
}
