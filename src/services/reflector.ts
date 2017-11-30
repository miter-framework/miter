import * as _ from 'lodash';
import * as http from 'http';
import * as https from 'https';

import { CtorT } from '../core/ctor';
import { ServiceT } from '../core/service';
import { Injector } from '../core/injector';
import { Injectable } from '../decorators/services/injectable.decorator';
import { Name } from '../decorators/services/name.decorator';
import { ServerMetadata } from '../metadata/server/server';
import { Server } from '../server/server';
import { Logger } from '../services/logger';

@Injectable()
@Name('services')
export class ServiceReflector {
    constructor(
        private injector: Injector,
        private serverMeta: ServerMetadata,
        private logger: Logger
    ) { }
    
    async startServices() {
        this.logger.verbose(`Starting services...`);
        await this.reflectServices(this.serverMeta.services || []);
        this.logger.info(`Finished starting services.`);
    }
    
    private _startedServices: ServiceT[] = [];
    async reflectServices(services: CtorT<ServiceT>[]) {
        services = services || [];
        let failures = 0;
        for (let q = 0; q < services.length; q++) {
            let result = await this.reflectService(services[q]);
            if (!result) {
                this.logger.error(`Failed to start service: ${services[q].name || services[q]}`);
                failures++;
            }
        }
        
        if (!!failures) {
            this.logger.error(`${services.length - failures} services started correctly out of ${services.length}`);
            return false;
        }
        else {
            this.logger.info(`${services.length - failures} services started correctly out of ${services.length}`);
            return true;
        }
    }
    async reflectService(serviceFn: CtorT<ServiceT>): Promise<boolean> {
        let serviceName = serviceFn.name || serviceFn;
        try {
            let service = this.injector.resolveInjectable(serviceFn);
            if (typeof service === 'undefined') throw new Error(`Failed to inject service: ${serviceName}`);
            let result = await service.start();
            if (typeof result === 'boolean' && !result) return false;
            this._startedServices.push(service);
            return true;
        }
        catch (e) {
            this.logger.error(`Exception occurred when trying to start service: ${serviceName}`);
            this.logger.error(e);
            return false;
        }
    }
    
    async listenServices(webServer: http.Server | https.Server) {
        this.logger.verbose(`Sending services 'listen' lifecycle hook...`);
        let result = await this.listenServicesImpl(webServer);
        this.logger.verbose(`Finished sending services 'listen' lifecycle hook.`);
        return result;
    }
    async listenServicesImpl(webServer: http.Server | https.Server) {
        let services = [...this._startedServices];
        let failures = 0;
        for (let q = 0; q < services.length; q++) {
            let result = await this.listenService(services[q], webServer);
            if (!result) {
                this.logger.error(`Failed to send 'listen' lifecycle hook for service: ${services[q]}`);
                failures++;
            }
        }
        
        if (!!failures) {
            this.logger.error(`${services.length - failures} services recieved 'listen' lifecycle hook correctly out of ${services.length}`);
            return false;
        }
        else {
            this.logger.verbose(`${services.length - failures} services recieved 'listen' lifecycle hook correctly out of ${services.length}`);
            return true;
        }
    }
    async listenService(service: ServiceT, webServer: http.Server | https.Server): Promise<boolean> {
        let serviceName = `${service}`;
        try {
            if (typeof service.listen !== 'undefined') await service.listen(webServer);
            return true;
        }
        catch (e) {
            this.logger.error(`Exception occurred when trying to stop service: ${serviceName}`);
            this.logger.error(e);
            return false;
        }
    }
    
    async shutdownServices() {
        this.logger.verbose(`Shutting down services...`);
        let result = await this.shutdownServicesImpl();
        this.logger.info(`Finished shutting down services.`);
        return result;
    }
    async shutdownServicesImpl() {
        let services = this._startedServices;
        this._startedServices = [];
        let failures = 0;
        for (let q = 0; q < services.length; q++) {
            let result = await this.shutdownService(services[q]);
            if (!result) {
                this.logger.error(`Failed to stop service: ${services[q]}`);
                failures++;
            }
        }
        
        if (!!failures) {
            this.logger.error(`${services.length - failures} services terminated correctly out of ${services.length}`);
            return false;
        }
        else {
            this.logger.info(`${services.length - failures} services terminated correctly out of ${services.length}`);
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
            this.logger.error(`Exception occurred when trying to stop service: ${serviceName}`);
            this.logger.error(e);
            return false;
        }
    }
}
