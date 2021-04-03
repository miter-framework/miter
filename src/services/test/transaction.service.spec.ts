/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { TransactionService } from '../transaction.service';
import { LoggerCore } from '../logger-core';
import { Logger } from '../logger';
import { ClsNamespaceService } from '../cls-namespace.service';
import { Injector } from '../../core/injector';
import { ServerMetadata } from '../../metadata/server';
import { TransactionT } from '../../core/transaction';
import { ORMService } from '../orm.service';
import { FakeORMService } from './fake-orm.service';
import { RouterReflector } from '../../router/reflector';
import { FakeRouterReflector } from '../../router/test/fake-reflector';

describe('TransactionService', () => {
  let transactService: TransactionService;
  beforeEach(() => {
    let loggerCore = new LoggerCore('abc', 'error', false);
    let injector = new Injector(loggerCore);
    injector.provide({ provide: ServerMetadata, useValue: <any>{ name: 'abc' } });
    injector.provide({ provide: ORMService, useClass: FakeORMService });
    injector.provide({ provide: RouterReflector, useClass: FakeRouterReflector });
    transactService = injector.resolveInjectable(TransactionService)!;
  });

  it('should start with no transaction', () => {
    expect(transactService.current).to.be.undefined;
  });

  describe('.run', () => {
    it('should not have a transaction after the asynchronous task completes', async () => {
      expect(transactService.current).to.be.undefined;
      await transactService.run(`test0`, async () => {
        expect(transactService.current).not.to.be.undefined;
      });
      expect(transactService.current).to.be.undefined;
    });

    it('should nest transactions by default', async () => {
      await transactService.run(`test0`, async () => {
        expect(transactService.current!.fullName).to.match(/test0/i);
        await transactService.run(`test1`, async () => {
          expect(transactService.current!.fullName).to.match(/test0.*test1/i);
        });
      });
    });

    it('should not nest transactions by if detach = true', async () => {
      await transactService.run(`test0`, async () => {
        expect(transactService.current!.fullName).to.match(/test0/i);
        await transactService.run(`test1`, true, async () => {
          expect(transactService.current!.fullName).not.to.match(/test0.*test1/i);
        });
      });
    });

    it('should persist a transaction after an asynchronous operation', (done) => {
      transactService.run(`test0`, async () => {
        let transact = transactService.current;
        expect(transact).not.to.be.undefined;
        setTimeout(() => {
          expect(transact).to.eql(transact);
          done();
        }, 10);
      });
    });

    it('should return a promise that resolves to the result of the function', async () => {
      let result = await transactService.run(`test0`, async () => {
        return 42;
      });
      expect(result).to.eql(42);
    });

    it('should commit the transaction when the task completes successfully', async () => {
      let transact: TransactionT = <any>void(0);
      let stubbed: {
        commit: sinon.SinonStub,
        rollback: sinon.SinonStub
      } = <any>{};
      await transactService.run(`test0`, async () => {
        transact = transactService.current!;
        expect(transact.isComplete).to.be.false;
        stubbed.commit = sinon.stub(transact, 'commit').callThrough();
        stubbed.rollback = sinon.stub(transact, 'rollback').callThrough();
      });
      expect(transact.isComplete).to.be.true;
      expect(transact.commit).to.have.been.calledOnce;
      expect(transact.rollback).not.to.have.been.called;
      stubbed.commit.restore();
      stubbed.rollback.restore();
    });

    it('should rollback the transaction when the task throws an exception', async () => {
      let transact: TransactionT = <any>void(0);
      let stubbed: {
        commit: sinon.SinonStub,
        rollback: sinon.SinonStub
      } = <any>{};
      try {
        await transactService.run(`test0`, async () => {
          transact = transactService.current!;
          expect(transact.isComplete).to.be.false;
          stubbed.commit = sinon.stub(transact, 'commit').callThrough();
          stubbed.rollback = sinon.stub(transact, 'rollback').callThrough();
          throw new Error('Forced!');
        });
      }
      catch (e) { }
      expect(transact.isComplete).to.be.true;
      expect(transact.commit).not.to.have.been.called;
      expect(transact.rollback).to.have.been.calledOnce;
      stubbed.commit.restore();
      stubbed.rollback.restore();
    });
  });
});
