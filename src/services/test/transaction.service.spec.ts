/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { TransactionService } from '../transaction.service';
import { Sequelize } from '../../orm/sequelize';
import { FakeSequelize } from '../../orm/test/fake-sequelize';
import { Logger } from '../logger';
import { ClsNamespaceService } from '../cls-namespace.service';
import { TransactionT } from '../../core/transaction';

describe('TransactionService', () => {
    let transactService: TransactionService;
    beforeEach(() => {
        let logger = new Logger('abc', 'error', false);
        let clsNamespace = new ClsNamespaceService(<any>{ name: 'abc' });
        let fakeSql: Sequelize = <any>new FakeSequelize(logger, clsNamespace);
        transactService = new TransactionService(fakeSql, logger, clsNamespace);
    });
    
    it('should start with no transaction', () => {
        expect(transactService.current).to.be.undefined;
    });
    
    describe('.run', () => {
        it('should persist a transaction after an asynchronous operation', (done) => {
            expect(transactService.current).to.be.undefined;
            transactService.run(`test0`, async () => {
                let transact = transactService.current;
                expect(transact).not.to.be.undefined;
                setTimeout(() => {
                    expect(transact).to.eql(transact);
                    done();
                }, 10);
            });
            expect(transactService.current).to.be.undefined;
        });
        
        it('should return a promise that resolves to the result of the function', async () => {
            let result = await transactService.run(`test0`, async () => {
                return 42;
            });
            expect(result).to.eql(42);
        });
        
        it('should commit the transaction when the task completes successfully', async () => {
            let transact: TransactionT;
            let stubbed: {
                commit: sinon.SinonStub,
                rollback: sinon.SinonStub
            } = <any>{};
            await transactService.run(`test0`, async () => {
                transact = transactService.current;
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
            let transact: TransactionT;
            let stubbed: {
                commit: sinon.SinonStub,
                rollback: sinon.SinonStub
            } = <any>{};
            try {
                await transactService.run(`test0`, async () => {
                    transact = transactService.current;
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
