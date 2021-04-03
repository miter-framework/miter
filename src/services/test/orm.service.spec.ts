/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { ORMService } from '../orm.service';
import { Injector } from '../../core/injector';
import { LoggerCore } from '../logger-core';

describe('ORMService', () => {
  let injector: Injector;
  let loggerCore: LoggerCore;
  beforeEach(() => {
    loggerCore = new LoggerCore('test', 'error', false);
    injector = new Injector(loggerCore);
  });

  describe('when no implementation has been provided to the injector', () => {
    it('should resolve to null', () => {
      let instance = injector.resolveInjectable(ORMService);
      expect(instance).to.be.null;
    });
    it('should log an error using the "ORMService" logger', () => {
      let myLogger = loggerCore.getSubsystem('ORMService');
      sinon.stub(myLogger, 'error');
      injector.resolveInjectable(ORMService);
      expect(myLogger.error).to.have.been.calledOnce;
    });
    it('should only log an error once, even if it is resolved multiple times', () => {
      let myLogger = loggerCore.getSubsystem('ORMService');
      sinon.stub(myLogger, 'error');
      injector.resolveInjectable(ORMService);
      injector.resolveInjectable(ORMService);
      expect(myLogger.error).to.have.been.calledOnce;
    });
  });
});
