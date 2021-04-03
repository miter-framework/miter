/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { stubDirectLogger } from '../../util/test/stub-direct-logger';
import { LoggerCore } from '../logger-core';
import { Logger } from '../logger';

const testServerName = 'abc-xyz';
const logLevels = {
  'verbose': 'verbose',
  'warn': 'warn',
  'info': 'info',
  'error': 'error',
  'default': 'verbose'
};

describe('LoggerCore', () => {
  let instance: LoggerCore;
  before(() => instance = new LoggerCore(testServerName, logLevels, false));

  let stubs = stubDirectLogger();

  describe('.serverName', () => {
    it('should persist the server name correctly', () => {
      expect(instance.serverName).to.eq(testServerName);
    });
  });

  describe('.getSubsystem', () => {
    it('should return an instance of Logger with the specified subsystem', () => {
      let logger = instance.getSubsystem('fish');
      expect(logger).to.be.an.instanceOf(Logger);
      expect(logger.subsystem).to.eq('fish');
    });
    it('should only create one logger for each subsystem', () => {
      let logger1 = instance.getSubsystem('fish');
      let logger2 = instance.getSubsystem('fish');
      expect(logger1).to.eq(logger2);
    });
  });

  describe('.log', () => {
    it('should call console.log with the server, subsystem, and message', () => {
      let { log } = stubs;
      instance.log('subsys', 'message1', 'message2', 'message3');
      expect(log).to.have.been.calledWithMatch(/\[.*abc-xyz.*:.*subsys.*\]/, 'message1', 'message2', 'message3');
    });
    it('should call console.log with the server and message if there is no subsystem', () => {
      let { log } = stubs;
      instance.log(null, 'message1', 'message2', 'message3');
      expect(log).to.have.been.calledWithMatch(/\[.*abc-xyz[^:]*\]/, 'message1', 'message2', 'message3');
    });
  });

  describe('.trace', () => {
    it('should call console.trace with the server, subsystem, and message', () => {
      let { trace } = stubs;
      instance.trace('subsys', 'message1', 'message2', 'message3');
      expect(trace).to.have.been.calledWithMatch(/\[.*abc-xyz.*:.*subsys.*\]/, 'message1', 'message2', 'message3');
    });
    it('should call console.trace with the server and message if there is no subsystem', () => {
      let { trace } = stubs;
      instance.trace(null, 'message1', 'message2', 'message3');
      expect(trace).to.have.been.calledWithMatch(/\[.*abc-xyz[^:]*\]/, 'message1', 'message2', 'message3');
    });
  });

  describe('.error', () => {
    it('should call console.error with the server, subsystem, and message', () => {
      let { error } = stubs;
      instance.error('subsys', 'message1', 'message2', 'message3');
      expect(error).to.have.been.calledWithMatch(/\[.*abc-xyz.*:.*subsys.*\]/, 'error:', 'message1', 'message2', 'message3');
    });
    it('should call console.error with the server and message if there is no subsystem', () => {
      let { error } = stubs;
      instance.error(null, 'message1', 'message2', 'message3');
      expect(error).to.have.been.calledWithMatch(/\[.*abc-xyz[^:]*\]/, 'error:', 'message1', 'message2', 'message3');
    });
  });

  describe('.info', () => {
    it('should call console.info with the server, subsystem, and message', () => {
      let { info } = stubs;
      instance.info('subsys', 'message1', 'message2', 'message3');
      expect(info).to.have.been.calledWithMatch(/\[.*abc-xyz.*:.*subsys.*\]/, 'info:', 'message1', 'message2', 'message3');
    });
    it('should call console.info with the server and message if there is no subsystem', () => {
      let { info } = stubs;
      instance.info(null, 'message1', 'message2', 'message3');
      expect(info).to.have.been.calledWithMatch(/\[.*abc-xyz[^:]*\]/, 'info:', 'message1', 'message2', 'message3');
    });
    it('should call console.info if the subsystem is info or verbose', () => {
      let { info } = stubs;
      instance.info('info', 'message1', 'message2', 'message3');
      instance.info('verbose', 'message1', 'message2', 'message3');
      expect(info).to.have.been.called;
    });
    it('should not call console.info if the subsystem is error or warn', () => {
      let { info } = stubs;
      instance.info('error', 'message1', 'message2', 'message3');
      instance.info('warn', 'message1', 'message2', 'message3');
      expect(info).not.to.have.been.called;
    });
  });

  describe('.warn', () => {
    it('should call console.warn with the server, subsystem, and message', () => {
      let { warn } = stubs;
      instance.warn('subsys', 'message1', 'message2', 'message3');
      expect(warn).to.have.been.calledWithMatch(/\[.*abc-xyz.*:.*subsys.*\]/, 'warn:', 'message1', 'message2', 'message3');
    });
    it('should call console.warn with the server and message if there is no subsystem', () => {
      let { warn } = stubs;
      instance.warn(null, 'message1', 'message2', 'message3');
      expect(warn).to.have.been.calledWithMatch(/\[.*abc-xyz[^:]*\]/, 'warn:', 'message1', 'message2', 'message3');
    });
    it('should call console.warn if the subsystem is warn, info, or verbose', () => {
      let { warn } = stubs;
      instance.warn('warn', 'message1', 'message2', 'message3');
      instance.warn('info', 'message1', 'message2', 'message3');
      instance.warn('verbose', 'message1', 'message2', 'message3');
      expect(warn).to.have.been.called;
    });
    it('should not call console.warn if the subsystem is error', () => {
      let { warn } = stubs;
      instance.warn('error', 'message1', 'message2', 'message3');
      expect(warn).not.to.have.been.called;
    });
  });

  describe('.verbose', () => {
    it('should call console.log with the server, subsystem, and message', () => {
      let { log } = stubs;
      instance.verbose('subsys', 'message1', 'message2', 'message3');
      expect(log).to.have.been.calledWithMatch(/\[.*abc-xyz.*:.*subsys.*\]/, 'verbose:', 'message1', 'message2', 'message3');
    });
    it('should call console.log with the server and message if there is no subsystem', () => {
      let { log } = stubs;
      instance.verbose(null, 'message1', 'message2', 'message3');
      expect(log).to.have.been.calledWithMatch(/\[.*abc-xyz[^:]*\]/, 'verbose:', 'message1', 'message2', 'message3');
    });
    it('should call console.log if the subsystem is verbose', () => {
      let { log } = stubs;
      instance.verbose('verbose', 'message1', 'message2', 'message3');
      expect(log).to.have.been.called;
    });
    it('should not call console.log if the subsystem is error, warn, or info', () => {
      let { log } = stubs;
      instance.verbose('error', 'message1', 'message2', 'message3');
      instance.verbose('warn', 'message1', 'message2', 'message3');
      instance.verbose('info', 'message1', 'message2', 'message3');
      expect(log).not.to.have.been.called;
    });
  });
});
