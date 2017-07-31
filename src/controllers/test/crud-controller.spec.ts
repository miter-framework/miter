/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { CrudController } from '../crud-controller';

import { Injectable } from '../../decorators/services/injectable.decorator';
import { Request, Response } from 'express';
import { PolicyDescriptor } from '../../core/policy';
import { Db } from '../../core/db';
import { FakeRequest } from '../../router/test/fake-request';
import { FakeResponse } from '../../router/test/fake-response';
import { HTTP_STATUS_ERROR, HTTP_STATUS_OK } from '../../util/http-status-type';

let any = sinon.match.any;

class TestModel {
    id: number;
    static db: Db<TestModel>;
}
class TestCrudController extends CrudController<TestModel> {
    constructor(pluralName?: string, singularName?: string) {
        super(TestModel, `TestModel`, pluralName, singularName);
    }
}
class FakeDb<T> implements Db<T> {
    async create(t: any) { return t; }
    async findById(id: string | number, options?: any): Promise<T | null> { return null; }
    async findOne(query: any): Promise<T | null> { return null; }
    async findOrCreate(query: any, defaults?: Object | T | undefined): Promise<[T, boolean]> { return [<any>defaults, true]; }
    async findAndCountAll(query?: any): Promise<any> { return <any>void(0); }
    async findAll(query?: any): Promise<T[]> { return []; }
    async all(query?: any): Promise<T[]> { return []; }
    async count(query?: any): Promise<number> { return 0; }
    async max<T>(field: string): Promise<number> { return 0; }
    async min<T>(field: string): Promise<number> { return 0; }
    async sum<T>(field: string): Promise<number> { return 0; }
    async save(t: T): Promise<T> { return t; }
    async update(query: any, replace: any, returning?: any) { return <any>void(0); }
    async updateOrCreate(query: any, defaults: Object | T): Promise<[T, boolean]> { return [<any>defaults, true]; }
    async destroy(query: any) { return <any>void(0); }
    fromJson(json: any): T { return <any>json; }
}

describe('CrudController', () => {
    let inst: TestCrudController;
    beforeEach(() => {
        inst = new TestCrudController();
        TestModel.db = new FakeDb<TestModel>();
    });
    
    describe('.ctor', () => {
        it('should create the singular name from the model name if one is not provided', () => {
            expect(inst.singularName).to.eq(`test-model`);
        });
        it('should use the provided singular name if one is provided', () => {
            let inst = new TestCrudController(undefined, 'my-singular-name');
            expect(inst.singularName).to.eq(`my-singular-name`);
        });
        it('should create the plural name from the model name if one is not provided', () => {
            expect(inst.pluralName).to.eq(`test-models`);
        });
        it('should use the provided plural name if one is provided', () => {
            let inst = new TestCrudController('my-plural-name');
            expect(inst.pluralName).to.eq(`my-plural-name`);
        });
    });
    
    describe('.splitOnWords', () => {
        let splitOnWords: (input: string) => IterableIterator<string>;
        beforeEach(() => {
            splitOnWords = (<any>inst).splitOnWords.bind(inst);
        });
        
        it('should yield an empty sequence on an empty input', () => {
            expect([...splitOnWords('')]).to.deep.eq([]);
        });
        it('should consider an uppercase letter the start of a new word', () => {
            expect([...splitOnWords('ABCdeF')]).to.deep.eq(['A', 'B', 'Cde', 'F']);
        });
        it('should consider an underscore the start of a new word', () => {
            expect([...splitOnWords('what_about_fish')]).to.deep.eq(['what', 'about', 'fish']);
        });
        it('should remove all underscores', () => {
            expect([...splitOnWords('___a_very___ODD_model_name____')]).to.deep.eq(['a', 'very', 'O', 'D', 'D', 'model', 'name']);
        });
    });
    
    describe('.getSingularPath', () => {
        let getSingularPath: (input: string) => string;
        beforeEach(() => {
            getSingularPath = (<any>inst).getSingularPath.bind(inst);
        });
        
        it('should return the input string if words cannot be parsed from it', () => {
            expect(getSingularPath('')).to.eq('');
            expect(getSingularPath('___')).to.eq('___');
        });
        it('should singularize the last word', () => {
            expect(getSingularPath('apples')).to.eq('apple');
            expect(getSingularPath('dog_orange_apples')).to.eq('dog-orange-apple');
        });
        it('should not modify any but the last word', () => {
            expect(getSingularPath('dogs_oranges_apples')).to.eq('dogs-oranges-apple');
        });
        it('should join the words using dashes', () => {
            expect(getSingularPath('ABCDE')).to.eq('a-b-c-d-e');
        });
        it('should transform all letters to lowercase', () => {
            expect(getSingularPath('YellowBrickRoad')).to.eq('yellow-brick-road');
        });
    });
    
    describe('.getPluralPath', () => {
        let getPluralPath: (input: string) => string;
        beforeEach(() => {
            getPluralPath = (<any>inst).getPluralPath.bind(inst);
        });
        
        it('should return the input string if words cannot be parsed from it', () => {
            expect(getPluralPath('')).to.eq('');
            expect(getPluralPath('___')).to.eq('___');
        });
        it('should pluralize the last word', () => {
            expect(getPluralPath('apple')).to.eq('apples');
            expect(getPluralPath('dogs_oranges_apple')).to.eq('dogs-oranges-apples');
        });
        it('should not modify any but the last word', () => {
            expect(getPluralPath('dog_orange_apple')).to.eq('dog-orange-apples');
        });
        it('should join the words using dashes', () => {
            expect(getPluralPath('ABCDQueue')).to.eq('a-b-c-d-queues');
        });
        it('should transform all letters to lowercase', () => {
            expect(getPluralPath('YellowBrickRoad')).to.eq('yellow-brick-roads');
        });
    });
    
    describe('.transformPathPart', () => {
        it('should replace %%PLURAL_NAME%% with the plural route path', () => {
            expect(inst.transformPathPart('blah', `one/%%PLURAL_NAME%%/three`)).to.eq(`one/${inst.pluralName}/three`);
        });
        it('should replace %%SINGULAR_NAME%% with the singular route path', () => {
            expect(inst.transformPathPart('blah', `one/%%SINGULAR_NAME%%/three`)).to.eq(`one/${inst.singularName}/three`);
        });
        it('should replace all instances of both route paths', () => {
            expect(inst.transformPathPart('blah', `one/%%SINGULAR_NAME%%/%%PLURAL_NAME%%/%%SINGULAR_NAME%%/%%PLURAL_NAME%%/three`))
                .to.eq(`one/${inst.singularName}/${inst.pluralName}/${inst.singularName}/${inst.pluralName}/three`);
        });
    });
    
    describe('.transformRoutePolicies', () => {
        let routes: [string, boolean, boolean][] = [
            ['create', true, true],
            ['update', true, true],
            ['destroy', true, true],
            ['find', true, false],
            ['count', true, false],
            ['get', true, false],
            ['', false, false]
        ];
        let defaultPolicy: PolicyDescriptor = <any>Symbol();
        let readPolicy: PolicyDescriptor = <any>Symbol();
        let mutatePolicy: PolicyDescriptor = <any>Symbol();
        beforeEach(() => {
            sinon.stub(inst, 'getReadPolicies').returns([readPolicy]);
            sinon.stub(inst, 'getMutatePolicies').returns([mutatePolicy]);
        });
        routes.forEach(([routeFnName, includeReadPolicies, includeMutatePolicies]) => {
            describe(`when transforming policies for ${routeFnName ? 'the \'' + routeFnName + '\'' : 'any other'} route`, () => {
                it('should include the policies passed in', () => {
                    let policies = inst.transformRoutePolicies(routeFnName || 'zzyzx', `one/two/three`, [defaultPolicy]);
                    expect(policies.indexOf(defaultPolicy)).not.to.eq(-1);
                });
                it(`should ${includeReadPolicies ? '' : 'not '}include the read policies`, () => {
                    let policies = inst.transformRoutePolicies(routeFnName || 'zzyzx', `one/two/three`, [defaultPolicy]);
                    if (includeReadPolicies) expect(policies.indexOf(readPolicy)).not.to.eq(-1);
                    else expect(policies.indexOf(readPolicy)).to.eq(-1);
                });
                it(`should ${includeMutatePolicies ? '' : 'not '}include the mutate policies`, () => {
                    let policies = inst.transformRoutePolicies(routeFnName || 'zzyzx', `one/two/three`, [defaultPolicy]);
                    if (includeMutatePolicies) expect(policies.indexOf(mutatePolicy)).not.to.eq(-1);
                    else expect(policies.indexOf(mutatePolicy)).to.eq(-1);
                });
            });
        });
    });
    
    describe('create', () => {
        describe('.create', () => {
            let req: Request;
            let res: Response;
            let payload: any = Symbol();
            beforeEach(() => {
                req = FakeRequest();
                res = FakeResponse();
                req.body = payload;
                req.path = 'user/create';
            });
            
            it('should return a promise', () => {
                let result = (<any>inst).create();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should invoke transformCreateQuery', async () => {
                    sinon.stub(inst, 'transformCreateQuery');
                    await inst.create(req, res);
                    expect((<any>inst).transformCreateQuery).to.have.been.calledOnce;
                });
                it('should use the original create query if transformCreateQuery returns a falsey value', async () => {
                    sinon.spy(inst, 'performCreate');
                    sinon.stub(inst, 'transformCreateQuery').returns(undefined);
                    await inst.create(req, res);
                    expect((<any>inst).performCreate).to.have.been.calledOnce.calledWith(req, res, payload);
                });
                it('should use the transformed query returned by transformCreateQuery', async () => {
                    sinon.spy(inst, 'performCreate');
                    let newPayload = Symbol();
                    sinon.stub(inst, 'transformCreateQuery').returns(newPayload);
                    await inst.create(req, res);
                    expect((<any>inst).performCreate).to.have.been.calledOnce.calledWith(req, res, newPayload);
                });
                it('should short circuit if transformCreateQuery sends a response', async () => {
                    sinon.stub(inst, 'beforeCreate');
                    sinon.stub(inst, 'transformCreateQuery').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    await inst.create(req, res);
                    expect((<any>inst).beforeCreate).not.to.have.been.called;
                });
                it('should send HTTP_STATUS_ERROR if there is no create query', async () => {
                    delete req.body;
                    await inst.create(req, res);
                    expect(res.statusCode).to.eq(HTTP_STATUS_ERROR);
                });
                it('should throw an error if the create body is an array', async () => {
                    req.body = [{}, {}];
                    try { await inst.create(req, res); }
                    catch (e) {
                        if (e instanceof Error && e.message.match(/createMany not supported/i)) return;
                    }
                    expect(false).to.be.true;
                });
                it('should invoke beforeCreate', async () => {
                    sinon.stub(inst, 'beforeCreate');
                    await inst.create(req, res);
                    expect((<any>inst).beforeCreate).to.have.been.calledOnce;
                });
                it('should short circuit if beforeCreate sends a response', async () => {
                    sinon.stub(inst, 'beforeCreate').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    sinon.stub(inst, 'performCreate');
                    await inst.create(req, res);
                    expect((<any>inst).performCreate).not.to.have.been.called;
                });
                it('should invoke performCreate', async () => {
                    sinon.stub(inst, 'performCreate');
                    await inst.create(req, res);
                    expect((<any>inst).performCreate).to.have.been.calledOnce;
                });
                it('should short circuit if performCreate sends a response', async () => {
                    sinon.stub(inst, 'performCreate').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    sinon.stub(inst, 'transformCreateResult');
                    await inst.create(req, res);
                    expect((<any>inst).transformCreateResult).not.to.have.been.called;
                });
                it('should invoke transformCreateResult', async () => {
                    sinon.stub(inst, 'transformCreateResult');
                    await inst.create(req, res);
                    expect((<any>inst).transformCreateResult).to.have.been.calledOnce;
                });
                it('should short circuit if transformCreateResult sends a response', async () => {
                    sinon.stub(inst, 'transformCreateResult').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    sinon.stub(inst, 'afterCreate');
                    await inst.create(req, res);
                    expect((<any>inst).afterCreate).not.to.have.been.called;
                });
                it('should invoke afterCreate', async () => {
                    sinon.stub(inst, 'afterCreate');
                    await inst.create(req, res);
                    expect((<any>inst).afterCreate).to.have.been.calledOnce;
                });
                it('should short circuit if afterCreate sends a response', async () => {
                    sinon.stub(inst, 'afterCreate').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    await inst.create(req, res);
                    expect(res.statusCode).to.eq(123);
                });
                it('should send HTTP_STATUS_OK with the value returned by transformCreateResult', async () => {
                    sinon.spy(res, 'status');
                    sinon.spy(res, 'json');
                    let expectedResult = Symbol();
                    sinon.stub(inst, 'transformCreateResult').returns(expectedResult);
                    await inst.create(req, res);
                    expect(res.status).to.have.been.calledOnce.calledWith(HTTP_STATUS_OK);
                    expect(res.json).to.have.been.calledOnce.calledWith(expectedResult);
                });
            });
        });
        
        describe('.beforeCreate', () => {
            it('should return a promise', () => {
                let result = (<any>inst).beforeCreate();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve', async () => {
                    await (<any>inst).beforeCreate(void(0), void(0), 42, {});
                });
            });
        });
        
        describe('.afterCreate', () => {
            it('should return a promise', () => {
                let result = (<any>inst).afterCreate();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve', async () => {
                    await (<any>inst).afterCreate(void(0), void(0), 42, {});
                });
            });
        });
        
        describe('.transformCreateQuery', () => {
            it('should return a promise', () => {
                let result = (<any>inst).transformCreateQuery();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the original passed-in query', async () => {
                    let query = Symbol();
                    let promise = (<any>inst).transformCreateQuery(void(0), void(0), query);
                    let result = await promise;
                    expect(result).to.eq(query);
                });
            });
        });
        
        describe('.performCreate', () => {
            it('should return a promise', () => {
                let result = (<any>inst).performCreate();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the results of querying the model DB', async () => {
                    let data = Symbol();
                    let expectedResult = Symbol();
                    sinon.stub(TestModel.db, 'create').returns(Promise.resolve(expectedResult));
                    let promise = (<any>inst).performCreate(void(0), void(0), data);
                    let result = await promise;
                    expect(result).to.eq(expectedResult);
                });
            });
        });
        
        describe('.transformCreateResult', () => {
            it('should return a promise', () => {
                let result = (<any>inst).transformCreateResult();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the original passed-in result', async () => {
                    let origResult = Symbol();
                    let promise = (<any>inst).transformCreateResult(void(0), void(0), origResult);
                    let result = await promise;
                    expect(result).to.eq(origResult);
                });
            });
        });
    });
    
    describe('read', () => {
        describe('.find', () => {
            it('should return a promise', () => {
                let result = (<any>inst).find();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                let req: Request;
                let res: Response;
                let payload: any;
                let performQueryStub: sinon.SinonStub;
                beforeEach(() => {
                    req = FakeRequest();
                    res = FakeResponse();
                    req.query.query = JSON.stringify(payload = { column: 'POISSON' });
                    req.path = 'users/find';
                    performQueryStub = sinon.stub(inst, 'performQuery').returns({ results: [1, 2, 3], count: 3 });
                });
                
                it('should send HTTP_STATUS_ERROR if there is an error parsing request params', async () => {
                    req.query.query = '{Sdf38--s=-?';
                    await inst.find(req, res);
                    expect(res.statusCode).to.eq(HTTP_STATUS_ERROR);
                });
                it('should use the include array from the query if there is no standalone include array', async () => {
                    let expectedInclude: string[] = ['one', 'deux', 'tres'];
                    req.query.query = JSON.stringify({ column: 'POISSON', include: expectedInclude });
                    sinon.stub(inst, 'transformInclude');
                    await inst.find(req, res);
                    expect((<any>inst).transformInclude).to.have.been.calledOnce.calledWith(req, res, expectedInclude);
                });
                it('should use the order array from the query if there is no standalone order array', async () => {
                    let expectedOrder: [string, 'ASC' | 'DESC'][] = [['one', 'ASC'], ['deux', 'DESC'], ['tres', 'ASC']];
                    req.query.query = JSON.stringify({ column: 'POISSON', order: expectedOrder });
                    await inst.find(req, res);
                    let actualOrder: any;
                    expect(performQueryStub).to.have.been.calledOnce.calledWith(any, any, sinon.match.has('order', sinon.match((val: any) => actualOrder = val)));
                    expect(actualOrder).to.deep.eq(expectedOrder);
                });
                it('should use the standalone include array if it exists', async () => {
                    let expectedInclude: string[] = ['one', 'deux', 'tres'];
                    req.query.include = JSON.stringify(expectedInclude);
                    sinon.stub(inst, 'transformInclude');
                    await inst.find(req, res);
                    expect((<any>inst).transformInclude).to.have.been.calledOnce.calledWith(req, res, expectedInclude);
                });
                it('should use the standalone order array if it exists', async () => {
                    let expectedOrder: [string, 'ASC' | 'DESC'][] = [['one', 'ASC'], ['deux', 'DESC'], ['tres', 'ASC']];
                    req.query.order = JSON.stringify(expectedOrder);
                    await inst.find(req, res);
                    let actualOrder: any;
                    expect(performQueryStub).to.have.been.calledOnce.calledWith(any, any, sinon.match.has('order', sinon.match((val: any) => actualOrder = val)));
                    expect(actualOrder).to.deep.eq(expectedOrder);
                });
                it('should invoke transformQuery', async () => {
                    sinon.stub(inst, 'transformQuery');
                    await inst.find(req, res);
                    expect((<any>inst).transformQuery).to.have.been.calledOnce;
                });
                it('should use the original query if transformQuery returns a falsey value', async () => {
                    let actualQuery: any;
                    sinon.stub(inst, 'transformQuery').callsFake((req, res, query) => (actualQuery = query, undefined));
                    await inst.find(req, res);
                    expect((<any>inst).performQuery).to.have.been.calledOnce.calledWith(any, any, sinon.match.has('where', actualQuery));
                });
                it('should short circuit if transformQuery sends a response', async () => {
                    sinon.stub(inst, 'transformInclude');
                    sinon.stub(inst, 'transformQuery').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    await inst.find(req, res);
                    expect((<any>inst).transformInclude).not.to.have.been.called;
                });
                it('should invoke transformInclude', async () => {
                    sinon.stub(inst, 'transformInclude');
                    await inst.find(req, res);
                    expect((<any>inst).transformInclude).to.have.been.calledOnce;
                });
                it('should use the original include array if transformInclude returns a falsey value', async () => {
                    let actualInclude: any;
                    sinon.stub(inst, 'transformInclude').callsFake((req, res, include) => (actualInclude = include, undefined));
                    await inst.find(req, res);
                    expect((<any>inst).performQuery).to.have.been.calledOnce.calledWith(any, any, sinon.match.has('include', actualInclude));
                });
                it('should short circuit if transformInclude sends a response', async () => {
                    sinon.stub(inst, 'transformInclude').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    await inst.find(req, res);
                    expect((<any>inst).performQuery).not.to.have.been.called;
                });
                
                describe('when the query is a find-one query', () => {
                    beforeEach(() => {
                        req.path = req.path.replace(/find$/, 'find-one');
                    });
                    
                    it('should invoke performFindOneQuery', async () => {
                        sinon.stub(inst, 'performFindOneQuery');
                        await inst.find(req, res);
                        expect((<any>inst).performFindOneQuery).to.have.been.calledOnce;
                    });
                    it('should short circuit if performFindOneQuery sends a response', async () => {
                        sinon.stub(inst, 'transformResult');
                        sinon.stub(inst, 'performFindOneQuery').callsFake((req, res) => {
                            res.status(123).send('FISH');
                        });
                        await inst.find(req, res);
                        expect((<any>inst).transformResult).not.to.have.been.called;
                    });
                    it('should invoke transformResult', async () => {
                        sinon.stub(inst, 'transformResult');
                        await inst.find(req, res);
                        expect((<any>inst).transformResult).to.have.been.calledOnce;
                    });
                    it('should short circuit if transformResult sends a response', async () => {
                        sinon.stub(inst, 'transformResult').callsFake((req, res) => {
                            res.status(123).send('FISH');
                        });
                        await inst.find(req, res);
                        expect(res.statusCode).to.eq(123);
                    });
                    it('should send HTTP_STATUS_OK with the value returned by transformResult', async () => {
                        sinon.stub(res, 'json');
                        let expectedResult = Symbol();
                        sinon.stub(inst, 'transformResult').returns(expectedResult);
                        await inst.find(req, res);
                        expect(res.statusCode).to.eq(HTTP_STATUS_OK);
                        expect(res.json).to.have.been.calledOnce.calledWith(expectedResult);
                    });
                });
                
                describe('when the query is a find-many query', () => {
                    it('should default to page 0 with 10 items per page', async () => {
                        sinon.stub(res, 'json');
                        await inst.find(req, res);
                        expect(res.json).to.have.been.calledOnce.calledWith(sinon.match.has('perPage', 10).and(sinon.match.has('page', 0)));
                    });
                    it('should use the page and per-page values included in the query, if they exist', async () => {
                        [req.query.perPage, req.query.page] = ['14', '12'];
                        sinon.stub(res, 'json');
                        await inst.find(req, res);
                        expect(res.json).to.have.been.calledOnce.calledWith(sinon.match.has('perPage', 14).and(sinon.match.has('page', 12)));
                    });
                    it('should invoke performQuery', async () => {
                        await inst.find(req, res);
                        expect((<any>inst).performQuery).to.have.been.calledOnce;
                    });
                    it('should short circuit if performQuery sends a response', async () => {
                        sinon.stub(inst, 'transformQueryResults');
                        performQueryStub.callsFake((req, res) => {
                            res.status(123).send('FISH');
                        });
                        await inst.find(req, res);
                        expect((<any>inst).transformQueryResults).not.to.have.been.called;
                    });
                    it('should invoke transformQueryResults', async () => {
                        sinon.spy(inst, 'transformQueryResults');
                        await inst.find(req, res);
                        expect((<any>inst).transformQueryResults).to.have.been.calledOnce;
                    });
                    it('should short circuit if transformQueryResults sends a response', async () => {
                        sinon.stub(inst, 'transformQueryResults').callsFake((req, res) => {
                            res.status(123).send('FISH');
                        });
                        await inst.find(req, res);
                        expect(res.statusCode).to.eq(123);
                    });
                    it('should send HTTP_STATUS_OK with the value returned by transformQueryResults', async () => {
                        sinon.stub(res, 'json');
                        let expectedResult = { results: [1, 2, 3], count: 3 };
                        sinon.stub(inst, 'transformQueryResults').returns(expectedResult);
                        await inst.find(req, res);
                        expect(res.statusCode).to.eq(HTTP_STATUS_OK);
                        expect(res.json).to.have.been.calledOnce.calledWith(sinon.match.has('results', expectedResult.results).and(sinon.match.has('total', expectedResult.count)));
                    });
                });
            });
        });
        
        describe('.count', () => {
            it('should return a promise', () => {
                let result = (<any>inst).count();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {let req: Request;
                let res: Response;
                let payload: any;
                beforeEach(() => {
                    req = FakeRequest();
                    res = FakeResponse();
                    req.query.query = JSON.stringify(payload = { column: 'POISSON' });
                    req.path = 'users/count';
                });
                
                it('should send HTTP_STATUS_ERROR if there is an error parsing request params', async () => {
                    req.query.query = '{Sdf38--s=-?';
                    await inst.count(req, res);
                    expect(res.statusCode).to.eq(HTTP_STATUS_ERROR);
                });
                it('should invoke transformQuery', async () => {
                    sinon.stub(inst, 'transformQuery');
                    await inst.count(req, res);
                    expect((<any>inst).transformQuery).to.have.been.calledOnce;
                });
                it('should use the original query if transformQuery returns a falsey value', async () => {
                    let actualQuery: any;
                    sinon.stub(inst, 'transformQuery').callsFake((req, res, query) => (actualQuery = query, undefined));
                    sinon.stub(TestModel.db, 'count');
                    await inst.count(req, res);
                    expect(TestModel.db.count).to.have.been.calledOnce.calledWith(sinon.match.has('where', actualQuery));
                });
                it('should short circuit if transformQuery sends a response', async () => {
                    sinon.stub(TestModel.db, 'count');
                    sinon.stub(inst, 'transformQuery').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    await inst.find(req, res);
                    expect(TestModel.db.count).not.to.have.been.called;
                });
                it('should invoke db.count', async () => {
                    sinon.stub(TestModel.db, 'count');
                    await inst.count(req, res);
                    expect(TestModel.db.count).to.have.been.calledOnce;
                });
                it('should send HTTP_STATUS_OK with the value returned by db.count', async () => {
                    let expectedCount = 42;
                    sinon.stub(TestModel.db, 'count').returns(expectedCount);
                    sinon.stub(res, 'send');
                    await inst.count(req, res);
                    expect(res.statusCode).to.eq(HTTP_STATUS_OK);
                    expect(res.send).to.have.been.calledOnce.calledWith(`${expectedCount}`);
                });
            });
        });
        
        describe('.get', () => {
            it('should return a promise', () => {
                let result = (<any>inst).get();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                xit('should send HTTP_STATUS_ERROR if the ID is missing or invalid', async () => {
                    
                });
                xit('should send HTTP_STATUS_ERROR if there is an error parsing the include query', async () => {
                    
                });
                xit('should invoke transformInclude', async () => {
                    
                });
                xit('should short circuit if transformInclude sends a response', async () => {
                    
                });
                xit('should invoke db.findById with the query', async () => {
                    
                });
                xit('should invoke transformResult', async () => {
                    
                });
                xit('should short circuit if transformResult sends a response', async () => {
                    
                });
                xit('should send HTTP_STATUS_OK with the value returned by db.findById', async () => {
                    
                });
            });
        });
        
        describe('.transformQuery', () => {
            it('should return a promise', () => {
                let result = (<any>inst).transformQuery();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the original passed-in query', async () => {
                    let query = Symbol();
                    let promise = (<any>inst).transformQuery(void(0), void(0), query);
                    let result = await promise;
                    expect(result).to.eq(query);
                });
            });
        });
        
        describe('.transformInclude', () => {
            it('should return a promise', () => {
                let result = (<any>inst).transformInclude();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the original passed-in include or to undefined', async () => {
                    let include = Symbol();
                    let promise = (<any>inst).transformInclude(void(0), void(0), include);
                    let result = await promise;
                    expect(typeof result === 'undefined' || result === include).to.be.true;
                });
            });
        });
        
        describe('.performQuery', () => {
            it('should return a promise', () => {
                let result = (<any>inst).performQuery();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the results of querying the model DB', async () => {
                    let query = Symbol();
                    let expectedResult = Symbol();
                    sinon.stub(TestModel.db, 'findAndCountAll').returns(Promise.resolve(expectedResult));
                    let promise = (<any>inst).performQuery(void(0), void(0), query);
                    let result = await promise;
                    expect(result).to.eq(expectedResult);
                });
            });
        });
        
        describe('.performFindOneQuery', () => {
            it('should return a promise', () => {
                let result = (<any>inst).performFindOneQuery();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the results of querying the model DB', async () => {
                    let query = Symbol();
                    let expectedResult = Symbol();
                    sinon.stub(TestModel.db, 'findOne').returns(Promise.resolve(expectedResult));
                    let promise = (<any>inst).performFindOneQuery(void(0), void(0), query);
                    let result = await promise;
                    expect(result).to.eq(expectedResult);
                });
            });
        });
        
        describe('.transformQueryResults', () => {
            let transformQueryResults: (req: Request, res: Response, results: { results: any[], count: number }) => Promise<{ results: any[], count: number }>;
            let req: Request;
            let res: Response;
            let payload: any = Symbol();
            beforeEach(() => {
                transformQueryResults = (<any>inst).transformQueryResults.bind(inst);
                req = FakeRequest();
                res = FakeResponse();
                req.body = payload;
            });
            
            it('should return a promise', () => {
                let result = transformQueryResults(req, res, { results: [], count: 0 });
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should call transformResult on each result', async () => {
                    let results = [1, 2, 3, 4, 5, 6];
                    let trStub = sinon.stub(inst, 'transformResult');
                    await transformQueryResults(req, res, { results: results, count: results.length });
                    expect(trStub.callCount).to.eq(results.length);
                });
                it('should not include results that are removed by transformResult', async () => {
                    let results = [1, 2, 3, 4, 5, 6];
                    let trStub = sinon.stub(inst, 'transformResult').callsFake((req, res, val: number) => val % 2 === 0 ? val : undefined);
                    let finalResults = await transformQueryResults(req, res, { results: results, count: results.length });
                    expect(finalResults.results).to.deep.eq([2, 4, 6]);
                });
                it('should not change the result count even if any results are trimmed', async () => {
                    let results = [1, 2, 3, 4, 5, 6];
                    let trStub = sinon.stub(inst, 'transformResult').callsFake((req, res, val: number) => val % 2 === 0 ? val : undefined);
                    let finalResults = await transformQueryResults(req, res, { results: results, count: results.length });
                    expect(finalResults.count).to.eq(6);
                });
                it('should short circuit if transformResult sets a new status code or sends headers', async () => {
                    let results = [1, 2, 3, 4, 5, 6];
                    let trStub = sinon.stub(inst, 'transformResult').callsFake((req, res) => {
                        res.status(123).send('FISH');
                    });
                    let finalResults = await transformQueryResults(req, res, { results: results, count: results.length });
                    expect(trStub.callCount).to.eq(1);
                    expect(finalResults).not.to.be.ok;
                });
            });
        });
        
        describe('.transformResult', () => {
            it('should return a promise', () => {
                let result = (<any>inst).transformResult();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the original passed-in result', async () => {
                    let origResult = Symbol();
                    let promise = (<any>inst).transformResult(void(0), void(0), origResult);
                    let result = await promise;
                    expect(result).to.eq(origResult);
                });
            });
        });
    });
    
    describe('update', () => {
        describe('.update', () => {
            it('should return a promise', () => {
                let result = (<any>inst).update();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                xit('should send HTTP_STATUS_ERROR if the ID is missing or invalid', async () => {
                    
                });
                xit('should invoke transformUpdateQuery', async () => {
                    
                });
                xit('should use the original update query if transformUpdateQuery returns a falsey value', async () => {
                    
                });
                xit('should short circuit if transformUpdateQuery sends a response', async () => {
                    
                });
                xit('should send HTTP_STATUS_ERROR if there is no update query', async () => {
                    
                });
                xit('should send HTTP_STATUS_ERROR if there is an invalid returning query param', () => {
                    
                });
                xit('should invoke beforeUpdate', async () => {
                    
                });
                xit('should short circuit if beforeUpdate sends a response', async () => {
                    
                });
                xit('should invoke performUpdate', async () => {
                    
                });
                xit('should short circuit if performUpdate sends a response', async () => {
                    
                });
                
                describe('when performUpdate indicates that the model was updated', () => {
                    xit('should invoke transformUpdateResult', async () => {
                        
                    });
                    xit('should short circuit if transformUpdateResult sends a response', async () => {
                        
                    });
                    xit('should invoke afterUpdate', async () => {
                        
                    });
                    xit('should short circuit if afterUpdate sends a response', async () => {
                        
                    });
                    xit('should send HTTP_STATUS_OK with the value returned by transformUpdateResult if returning = true', async () => {
                        
                    });
                    xit('should send HTTP_STATUS_OK without any value if returning = false', async () => {
                        
                    });
                });
                
                describe('when performUpdate indicates that the model was not updated', () => {
                    xit('should send HTTP_STATUS_ERROR', async () => {
                        
                    });
                });
            });
        });
        
        describe('.beforeUpdate', () => {
            it('should return a promise', () => {
                let result = (<any>inst).beforeUpdate();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve', async () => {
                    await (<any>inst).beforeUpdate(void(0), void(0), 42, {});
                });
            });
        });
        
        describe('.afterUpdate', () => {
            it('should return a promise', () => {
                let result = (<any>inst).afterUpdate();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve', async () => {
                    await (<any>inst).afterUpdate(void(0), void(0), 42, {});
                });
            });
        });
        
        describe('.transformUpdateQuery', () => {
            it('should return a promise', () => {
                let result = (<any>inst).transformUpdateQuery();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the original passed-in query', async () => {
                    let query = Symbol();
                    let promise = (<any>inst).transformUpdateQuery(void(0), void(0), query);
                    let result = await promise;
                    expect(result).to.eq(query);
                });
            });
        });
        
        describe('.performUpdate', () => {
            it('should return a promise', () => {
                let result = (<any>inst).performUpdate();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the results of querying the model DB', async () => {
                    let expectedResult = Symbol();
                    sinon.stub(TestModel.db, 'update').returns(Promise.resolve(expectedResult));
                    let promise = (<any>inst).performUpdate(void(0), void(0), 42, Symbol(), true);
                    let result = await promise;
                    expect(result).to.eq(expectedResult);
                });
            });
        });
        
        describe('.transformUpdateResult', () => {
            it('should return a promise', () => {
                let result = (<any>inst).transformUpdateResult();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve to the original passed-in result', async () => {
                    let origResult = Symbol();
                    let promise = (<any>inst).transformUpdateResult(void(0), void(0), origResult);
                    let result = await promise;
                    expect(result).to.eq(origResult);
                });
            });
        });
    });
    
    describe('delete', () => {
        describe('.destroy', () => {
            it('should return a promise', () => {
                let result = (<any>inst).destroy();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                xit('should send HTTP_STATUS_ERROR if the ID is missing or invalid', async () => {
                    
                });
                xit('should invoke db.destroy with the ID', async () => {
                    
                });
                xit('should invoke beforeDestroy', async () => {
                    
                });
                xit('should short circuit if beforeDestroy sends a response', async () => {
                    
                });
                
                describe('when db.destroy returns true', () => {
                    xit('should invoke afterDestroy', async () => {
                        
                    });
                    xit('should short circuit if afterDestroy sends a response', async () => {
                        
                    });
                    xit('should send HTTP_STATUS_OK', async () => {
                        
                    });
                });
                
                describe('when db.destroy returns false', () => {
                    xit('should send HTTP_STATUS_ERROR', async () => {
                        
                    });
                });
            });
        });
        
        describe('.beforeDestroy', () => {
            it('should return a promise', () => {
                let result = (<any>inst).beforeDestroy();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve', async () => {
                    await (<any>inst).beforeDestroy(void(0), void(0), 42, {});
                });
            });
        });
        
        describe('.afterDestroy', () => {
            it('should return a promise', () => {
                let result = (<any>inst).afterDestroy();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                it('should resolve', async () => {
                    await (<any>inst).afterDestroy(void(0), void(0), 42, {});
                });
            });
        });
    });
});
