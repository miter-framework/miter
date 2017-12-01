/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { ServiceReflector } from '../reflector';
import { LoggerCore } from '../logger-core';
import { Injector } from '../../core/injector';
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
        it('should return true if no services are passed in', async () => {
            expect(await serviceReflector.reflectServices([])).to.be.true;
            expect(await serviceReflector.reflectServices(<any>null)).to.be.true;
        });
        it('should return true if no services fail to start', async () => {
            expect(await serviceReflector.reflectServices([
                LifecycleWorkService,
                LifecycleWork2Service,
                LifecycleWork3Service
            ])).to.be.true;
        });
        it('should return false if any services fail to start', async () => {
            expect(await serviceReflector.reflectServices([
                LifecycleWorkService,
                LifecycleFailService
            ])).to.be.false;
        });
    });
    
    describe('.reflectService', () => {
        it(`should invoke the service's start function if it has one`, async () => {
            let lws = injector.resolveInjectable(LifecycleWorkService)!;
            let startStub = sinon.stub(lws, 'start').callThrough();
            await serviceReflector.reflectService(LifecycleWorkService);
            expect(lws.start).to.have.been.calledOnce;
        });
        it('should return true if the service has no start function', async () => {
            expect(await serviceReflector.reflectService(NoLifecycleService)).to.be.true;
        });
        it('should return true if the service start function returns true', async () => {
            expect(await serviceReflector.reflectService(LifecycleWorkService)).to.be.true;
        });
        it('should return false if the service start function throws an error', async () => {
            expect(await serviceReflector.reflectService(LifecycleThrowStartService)).to.be.false;
        });
        it('should return false if the service start function returns false', async () => {
            expect(await serviceReflector.reflectService(LifecycleFailService)).to.be.false;
        });
    });
    
    describe('.shutdownServices', () => {
        it('should return true if no services are started', async () => {
            await serviceReflector.reflectServices([]);
            expect(await serviceReflector.shutdownServices()).to.be.true;
        });
        it(`should return true if it doesn't fail to stop any services`, async () => {
            await serviceReflector.reflectServices([
                LifecycleWorkService,
                LifecycleWork2Service,
                LifecycleWork3Service
            ]);
            expect(await serviceReflector.shutdownServices()).to.be.true;
        });
        it('should return false if it fails to stop any services', async () => {
            await serviceReflector.reflectServices([
                LifecycleWorkService,
                LifecycleThrowStopService
            ]);
            expect(await serviceReflector.shutdownServices()).to.be.false;
        });
        it('should not shutdown a service that failed to start', async () => {
            let lts = injector.resolveInjectable(LifecycleThrowStartService)!;
            let stopStub = sinon.stub(lts, 'stop').callThrough();
            await serviceReflector.reflectServices([
                LifecycleThrowStartService
            ]);
            expect(await serviceReflector.shutdownServices()).to.be.true;
            expect(stopStub).not.to.have.been.called;
        });
    });
    
    describe('.shutdownService', () => {
        it(`should invoke the service's stop function if it has one`, async () => {
            let lws = injector.resolveInjectable(LifecycleWorkService)!;
            let startStub = sinon.stub(lws, 'stop').callThrough();
            await serviceReflector.shutdownService(lws);
            expect(lws.stop).to.have.been.calledOnce;
        });
        it('should return true if the service has no stop function', async () => {
            let nls = injector.resolveInjectable(NoLifecycleService)!;
            expect(await serviceReflector.shutdownService(nls)).to.be.true;
        });
        it('should return true if the service stop function returns without throwing', async () => {
            let lws = injector.resolveInjectable(LifecycleWorkService)!;
            expect(await serviceReflector.shutdownService(lws)).to.be.true;
        });
        it('should return false if the service stop function throws an error', async () => {
            let lts = injector.resolveInjectable(LifecycleThrowStopService)!;
            expect(await serviceReflector.shutdownService(lts)).to.be.false;
        });
    });
});
