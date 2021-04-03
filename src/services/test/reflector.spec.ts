/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { ServiceReflector } from '../reflector';
import { LoggerCore } from '../logger-core';
import { Injector } from '../../core/injector';
import { CtorT } from '../../core/ctor';
import { ServiceT } from '../../core/service';
import { ServerMetadata } from '../../metadata/server/server';
import { Service } from '../../decorators/services/service.decorator';

@Service()
class NoLifecycleService {
  async start() { }
}

@Service()
class LifecycleWorkService {
  async start() {
    return true;
  }
  async stop() { }
}
@Service()
class LifecycleWork2Service extends LifecycleWorkService { }
@Service()
class LifecycleWork3Service extends LifecycleWorkService { }

@Service()
class LifecycleFailService {
  async start() {
    return false;
  }
  async stop() { }
}

@Service()
class LifecycleThrowStartService {
  async start() {
    throw new Error('Throwing up!');
  }
  async stop() { }
}

@Service()
class LifecycleThrowStopService {
  async start() {
    return true;
  }
  async stop() {
    throw new Error('Throwing up!');
  }
}

describe('ServiceReflector', () => {
  let injector: Injector;
  let serviceReflector: ServiceReflector;
  beforeEach(() => {
    let loggerCore = new LoggerCore('abc', 'error', false);
    injector = new Injector(loggerCore);
    injector.provide({ provide: ServerMetadata, useValue: new ServerMetadata({ name: 'abc' }) });
    serviceReflector = injector.resolveInjectable(ServiceReflector)!;
  });

  describe('.reflectServices', () => {
    it('should not fail if no services are reflected', async () => {
      expect(() => serviceReflector.reflectServices([])).not.to.throw;
    });
    it('should not fail if services is not an array', async () => {
      expect(() => serviceReflector.reflectServices(<any>null)).not.to.throw;
    });
    it('should invoke reflectService on each service passed in', async () => {
      sinon.stub(<any>serviceReflector, 'reflectService');
      serviceReflector.reflectServices([
        LifecycleWorkService,
        LifecycleFailService
      ]);
      expect((<any>serviceReflector).reflectService).to.have.been.calledTwice;
    });
  });

  describe('.reflectService', () => {
    let fn: (service: CtorT<ServiceT>) => void;
    beforeEach(() => {
      fn = (<any>serviceReflector).reflectService.bind(serviceReflector);
    });

    it(`should resolve the service using the server's injector`, async () => {
      sinon.stub(injector, 'resolveInjectable').callThrough();
      await fn(NoLifecycleService);
      expect(injector.resolveInjectable).to.have.been.calledOnce;
    });
    it('should not fail if the injector fails to resolve the service', async () => {
      sinon.stub(injector, 'resolveInjectable').returns(null);
      await fn(NoLifecycleService);
    });
  });

  describe('.startServices', () => {
    it('should return true if no services have been reflected', async () => {
      serviceReflector.reflectServices([]);
      expect(await serviceReflector.startServices()).to.be.true;
      serviceReflector.reflectServices(<any>null);
      expect(await serviceReflector.startServices()).to.be.true;
    });
    it('should return true if no services fail to start', async () => {
      serviceReflector.reflectServices([
        LifecycleWorkService,
        LifecycleWork2Service,
        LifecycleWork3Service
      ]);
      expect(await serviceReflector.startServices()).to.be.true;
    });
    it('should return false if any services fail to start', async () => {
      serviceReflector.reflectServices([
        LifecycleWorkService,
        LifecycleFailService
      ]);
      expect(await serviceReflector.startServices()).to.be.false;
    });
  });

  describe('.startService', () => {
    let fn: (service: ServiceT) => Promise<boolean>;
    beforeEach(() => {
      fn = (<any>serviceReflector).startService.bind(serviceReflector);
    });

    it(`should invoke the service's start function if it has one`, async () => {
      let lws = injector.resolveInjectable(LifecycleWorkService)!;
      let startStub = sinon.stub(lws, 'start').callThrough();
      await fn(lws);
      expect(lws.start).to.have.been.calledOnce;
    });
    it('should return true if the service has no start function', async () => {
      let service = injector.resolveInjectable(NoLifecycleService)!;
      expect(await fn(service)).to.be.true;
    });
    it('should return true if the service start function returns true', async () => {
      let service = injector.resolveInjectable(LifecycleWorkService)!;
      expect(await fn(service)).to.be.true;
    });
    it('should return false if the service start function throws an error', async () => {
      let service = injector.resolveInjectable(LifecycleThrowStartService)!;
      expect(await fn(service)).to.be.false;
    });
    it('should return false if the service start function returns false', async () => {
      let service = injector.resolveInjectable(LifecycleFailService)!;
      expect(await fn(service)).to.be.false;
    });
  });

  describe('.shutdownServices', () => {
    it('should return true if no services are started', async () => {
      serviceReflector.reflectServices([]);
      await serviceReflector.startServices();
      expect(await serviceReflector.shutdownServices()).to.be.true;
    });
    it(`should return true if it doesn't fail to stop any services`, async () => {
      serviceReflector.reflectServices([
        LifecycleWorkService,
        LifecycleWork2Service,
        LifecycleWork3Service
      ]);
      await serviceReflector.startServices();
      expect(await serviceReflector.shutdownServices()).to.be.true;
    });
    it('should return false if it fails to stop any services', async () => {
      serviceReflector.reflectServices([
        LifecycleWorkService,
        LifecycleThrowStopService
      ]);
      await serviceReflector.startServices();
      expect(await serviceReflector.shutdownServices()).to.be.false;
    });
    it('should not shutdown a service that failed to start', async () => {
      let lts = injector.resolveInjectable(LifecycleThrowStartService)!;
      let stopStub = sinon.stub(lts, 'stop').callThrough();
      serviceReflector.reflectServices([LifecycleThrowStartService]);
      await serviceReflector.startServices();
      expect(await serviceReflector.shutdownServices()).to.be.true;
      expect(stopStub).not.to.have.been.called;
    });
  });

  describe('.shutdownService', () => {
    let fn: (service: ServiceT) => Promise<boolean>;
    beforeEach(() => {
      fn = (<any>serviceReflector).shutdownService.bind(serviceReflector);
    });

    it(`should invoke the service's stop function if it has one`, async () => {
      let lws = injector.resolveInjectable(LifecycleWorkService)!;
      let startStub = sinon.stub(lws, 'stop').callThrough();
      await fn(lws);
      expect(lws.stop).to.have.been.calledOnce;
    });
    it('should return true if the service has no stop function', async () => {
      let nls = injector.resolveInjectable(NoLifecycleService)!;
      expect(await fn(nls)).to.be.true;
    });
    it('should return true if the service stop function returns without throwing', async () => {
      let lws = injector.resolveInjectable(LifecycleWorkService)!;
      expect(await fn(lws)).to.be.true;
    });
    it('should return false if the service stop function throws an error', async () => {
      let lts = injector.resolveInjectable(LifecycleThrowStopService)!;
      expect(await fn(lts)).to.be.false;
    });
  });
});
