import * as _ from 'lodash';
import * as http from 'http';
import * as https from 'https';

import { CtorT } from '../core/ctor';
import { ServiceT } from '../core/service';
import { Injector } from '../core/injector';
import { Injectable } from '../decorators/services/injectable.decorator';
import { Name } from '../decorators/services/name.decorator';
import { ServerMetadata } from '../metadata/server/server';
import { Logger } from '../services/logger';

@Injectable()
@Name('services')
export class ServiceReflector {
  constructor(
    private injector: Injector,
    private serverMeta: ServerMetadata,
    private logger: Logger
  ) { }

  private _reflectedServices: ServiceT[] = [];
  reflectServices(services?: CtorT<ServiceT>[]) {
    if (typeof services === 'undefined') services = this.serverMeta.services;
    this.reflectServicesImpl(services || []);
  }
  private reflectServicesImpl(services: CtorT<ServiceT>[]) {
    for (let serviceCtor of services) {
      this.reflectService(serviceCtor);
    }
  }
  private reflectService(serviceFn: CtorT<ServiceT>): void {
    let serviceName = serviceFn.name || serviceFn;
    try {
      let service = this.injector.resolveInjectable(serviceFn);
      if (typeof service === 'undefined') throw new Error(`Failed to inject service: ${serviceName}`);
      this._reflectedServices.push(service);
    }
    catch (e) {
      this.logger.error(`Exception occurred when trying to inject service: ${serviceName}`);
      this.logger.error(e);
    }
  }

  private _startedServices: ServiceT[] = [];
  async startServices() {
    if (!this._reflectedServices || !this._reflectedServices.length) return true;
    this.logger.verbose(`Starting services...`);
    let result = await this.startServicesImpl();
    this.logger.info(`Finished starting services.`);
    return result;
  }
  private async startServicesImpl() {
    let services = this._reflectedServices;
    this._reflectedServices = [];
    let failures = 0;
    for (let service of services) {
      let serviceName = service.constructor.name || service.constructor;
      let result = await this.startService(service);
      if (!result) {
        this.logger.error(`Failed to start service: ${serviceName}`);
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
  private async startService(service: ServiceT) {
    let serviceName = service.constructor.name || service.constructor;
    try {
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
    if (!this._startedServices || !this._startedServices.length) return true;
    this.logger.verbose(`Shutting down services...`);
    let result = await this.shutdownServicesImpl();
    this.logger.info(`Finished shutting down services.`);
    return result;
  }
  private async shutdownServicesImpl() {
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
  private async shutdownService(service: ServiceT): Promise<boolean> {
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
