/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { SnakeCaseOrmTransformService } from '../snake-case-orm-transform.service';
import { ServerMetadata } from '../../metadata/server/server';

describe('SnakeCaseOrmTransformService', () => {
    let instance: SnakeCaseOrmTransformService;
    before(() => instance = new SnakeCaseOrmTransformService());
    
    describe('.transformModel', () => {
        it('should set underscored to true', () => {
            expect(instance.transformModel(<any>{})).to.have.property('underscored', true);
        });
    });
    
    describe('.transformModelName', () => {
        it('should return null if the class name is falsey', () => {
            expect(instance.transformModelName(<any>null)).to.be.null;
            expect(instance.transformModelName('')).to.be.null;
        });
        it('should pluralize and join the lowercase model name with underscores', () => {
            expect(instance.transformModelName('User')).to.eq('users');
            expect(instance.transformModelName('ProjectContributor')).to.eq('project_contributors');
            expect(instance.transformModelName('OneTwoThreeFour')).to.eq('one_two_three_fours');
        });
    });
    
    describe('.transformColumnName', () => {
        it('should return null if the column name is falsey', () => {
            expect(instance.transformColumnName(<any>null)).to.be.null;
            expect(instance.transformColumnName('')).to.be.null;
        });
        it('should join the lowercase column name with underscores', () => {
            expect(instance.transformColumnName('authorName')).to.eq('author_name');
            expect(instance.transformColumnName('avgRating')).to.eq('avg_rating');
            expect(instance.transformColumnName('isAvailable')).to.eq('is_available');
        });
    });
    
    describe('.transformAssociationColumnName', () => {
        it('should return null if the column name is falsey', () => {
            expect(instance.transformAssociationColumnName(<any>null)).to.be.null;
            expect(instance.transformAssociationColumnName('')).to.be.null;
        });
        it('should join the lowercase column name with underscores and append _id', () => {
            expect(instance.transformAssociationColumnName('ownerUser')).to.eq('owner_user_id');
            expect(instance.transformAssociationColumnName('projectReadme')).to.eq('project_readme_id');
            expect(instance.transformAssociationColumnName('forkedProject')).to.eq('forked_project_id');
        });
    });
});
