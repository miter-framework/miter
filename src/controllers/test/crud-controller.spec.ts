/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { CrudController } from '../crud-controller';

import { Injectable } from '../../decorators/services/injectable.decorator';
import { PolicyDescriptor } from '../../core/policy';
import { Db } from '../../core/db';

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
            it('should return a promise', () => {
                let result = (<any>inst).create();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                xit('should invoke transformCreateQuery', async () => {
                    
                });
                xit('should use the original create query if transformCreateQuery returns a falsey value', async () => {
                    
                });
                xit('should short circuit if transformCreateQuery sends a response', async () => {
                    
                });
                xit('should send HTTP_STATUS_ERROR if there is no create query', async () => {
                    
                });
                xit('should throw an error if the create body is an array', async () => {
                    
                });
                xit('should invoke beforeCreate', async () => {
                    
                });
                xit('should short circuit if beforeCreate sends a response', async () => {
                    
                });
                xit('should invoke performCreate', async () => {
                    
                });
                xit('should short circuit if performCreate sends a response', async () => {
                    
                });
                xit('should invoke transformCreateResult', async () => {
                    
                });
                xit('should short circuit if transformCreateResult sends a response', async () => {
                    
                });
                xit('should invoke afterCreate', async () => {
                    
                });
                xit('should short circuit if afterCreate sends a response', async () => {
                    
                });
                xit('should send HTTP_STATUS_OK with the value returned by transformCreateResult', async () => {
                    
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
                xit('should send HTTP_STATUS_ERROR if there is an error parsing request params', async () => {
                    
                });
                xit('should use the include array from the query if there is no standalone include array', async () => {
                    
                });
                xit('should use the order array from the query if there is no standalone order array', async () => {
                    
                });
                xit('should invoke transformQuery', async () => {
                    
                });
                xit('should use the original query if transformQuery returns a falsey value', async () => {
                    
                });
                xit('should short circuit if transformQuery sends a response', async () => {
                    
                });
                xit('should invoke transformInclude', async () => {
                    
                });
                xit('should use the original include array if transformInclude returns a falsey value', async () => {
                    
                });
                xit('should short circuit if transformInclude sends a response', async () => {
                    
                });
                
                describe('when the query is a find-one query', () => {
                    beforeEach(() => {
                        //TODO: ensure req.path ends with 'find-one'
                    });
                    
                    xit('should invoke performFindOneQuery', async () => {
                        
                    });
                    xit('should short circuit if performFindOneQuery sends a response', async () => {
                        
                    });
                    xit('should invoke transformResult', async () => {
                        
                    });
                    xit('should short circuit if transformResult sends a response', async () => {
                        
                    });
                    xit('should send HTTP_STATUS_OK with the value returned by transformResult', async () => {
                        
                    });
                });
                
                describe('when the query is a find-many query', () => {
                    xit('should default to page 0 with 10 items per page', () => {
                        
                    });
                    xit('should use the page and per-page values included in the query, if they exist', () => {
                        
                    });
                    xit('should invoke performQuery', async () => {
                        
                    });
                    xit('should short circuit if performQuery sends a response', async () => {
                        
                    });
                    xit('should invoke transformQueryResults', async () => {
                        
                    });
                    xit('should short circuit if transformQueryResults sends a response', async () => {
                        
                    });
                    xit('should send HTTP_STATUS_OK with the value returned by transformQueryResults', async () => {
                        
                    });
                });
            });
        });
        
        describe('.count', () => {
            it('should return a promise', () => {
                let result = (<any>inst).count();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                xit('should send HTTP_STATUS_ERROR if there is an error parsing request params', async () => {
                    
                });
                xit('should invoke transformQuery', async () => {
                    
                });
                xit('should use the original query if transformQuery returns a falsey value', async () => {
                    
                });
                xit('should short circuit if transformQuery sends a response', async () => {
                    
                });
                xit('should invoke db.count with the query', async () => {
                    
                });
                xit('should send HTTP_STATUS_OK with the value returned by db.count', async () => {
                    
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
            it('should return a promise', () => {
                let result = (<any>inst).transformQueryResults();
                expect(result).to.be.an.instanceOf(Promise);
            });
            describe('that promise', () => {
                xit('should call transformResult on each result', async () => {
                    
                });
                xit('should not include results that are removed by transformResult', async () => {
                    
                });
                xit('should return an updated count if any results are trimmed', async () => {
                    
                });
                xit('should short circuit if transformResult sets a new status code or sends headers', async () => {
                    
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
