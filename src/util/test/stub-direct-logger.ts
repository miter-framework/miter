/// <reference types="mocha" />

import * as sinon from 'sinon';

import { directLogger } from '../../util/direct-logger';

export function stubDirectLogger() {
  let stubbed: {
    log: sinon.SinonStub,
    info: sinon.SinonStub,
    warn: sinon.SinonStub,
    error: sinon.SinonStub,
    trace: sinon.SinonStub
  } = <any>{};
  beforeEach(() => {
    stubbed.log = sinon.stub(directLogger, 'log');
    stubbed.info = sinon.stub(directLogger, 'info');
    stubbed.warn = sinon.stub(directLogger, 'warn');
    stubbed.error = sinon.stub(directLogger, 'error');
    stubbed.trace = sinon.stub(directLogger, 'trace');
  });
  afterEach(() => {
    stubbed.log.restore();
    stubbed.info.restore();
    stubbed.warn.restore();
    stubbed.error.restore();
    stubbed.trace.restore();
  });
  return stubbed;
}
