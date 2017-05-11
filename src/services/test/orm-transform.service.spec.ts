/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { OrmTransformService } from '../orm-transform.service';
import { ServerMetadata } from '../../metadata/server/server';

describe('OrmTransformService', () => {
    let instance: OrmTransformService;
    before(() => instance = new OrmTransformService());
    
    describe('.transformModel', () => {
        it('should not modify the model metadata', () => {
            expect(instance.transformModel(<any>{})).to.deep.eql({});
        });
    });
    
    describe('.transformModelName', () => {
        it('should not modify the model name', () => {
            expect(instance.transformModelName('User')).to.be.null;
        });
    });
    
    describe('.transformColumn', () => {
        it('should not modify the column metadata', () => {
            expect(instance.transformColumn(<any>{})).to.deep.eql({});
        });
    });
    
    describe('.transformColumnName', () => {
        it('should not modify the column name', () => {
            expect(instance.transformColumnName('isPublished')).to.be.null;
        });
    });
    
    describe('.transformAssociation', () => {
        it('should not modify the column metadata', () => {
            expect(instance.transformAssociation(<any>{})).to.deep.eql({});
        });
    });
    
    describe('.transformAssociationColumnName', () => {
        it('should return null if the column name is falsey', () => {
            expect(instance.transformAssociationColumnName(<any>null)).to.be.null;
            expect(instance.transformAssociationColumnName('')).to.be.null;
        });
        it('should append Id if the column name is not falsey', () => {
            expect(instance.transformAssociationColumnName('ownerUser')).to.eq('ownerUserId');
            expect(instance.transformAssociationColumnName('projectReadme')).to.eq('projectReadmeId');
            expect(instance.transformAssociationColumnName('forkedProject')).to.eq('forkedProjectId');
        });
    });
});
