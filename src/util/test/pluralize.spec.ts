/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { pluralize } from '../pluralize';

describe('util/pluralize', () => {
    it('should return the plural form of the word passed in', () => {
        expect(pluralize('apple')).to.eql('apples');
        expect(pluralize('dog')).to.eql('dogs');
        expect(pluralize('cat')).to.eql('cats');
        expect(pluralize('mouse')).to.eql('mice');
        expect(pluralize('moose')).to.eql('moose');
        expect(pluralize('orange')).to.eql('oranges');
    });
    
    it('should return the same word if it is already plural', () => {
        expect(pluralize('apples')).to.eql('apples');
        expect(pluralize('dogs')).to.eql('dogs');
        expect(pluralize('cats')).to.eql('cats');
        expect(pluralize('mice')).to.eql('mice');
        expect(pluralize('moose')).to.eql('moose');
        expect(pluralize('oranges')).to.eql('oranges');
    });
    
    it('should return the singular form of the word passed in if plural=false', () => {
        expect(pluralize('apples', false)).to.eql('apple');
        expect(pluralize('dogs', false)).to.eql('dog');
        expect(pluralize('cats', false)).to.eql('cat');
        expect(pluralize('mice', false)).to.eql('mouse');
        expect(pluralize('moose', false)).to.eql('moose');
        expect(pluralize('oranges', false)).to.eql('orange');
    });
    
    it('should return the same word if already singular and plural=false', () => {
        expect(pluralize('apple', false)).to.eql('apple');
        expect(pluralize('dog', false)).to.eql('dog');
        expect(pluralize('cat', false)).to.eql('cat');
        expect(pluralize('mouse', false)).to.eql('mouse');
        expect(pluralize('moose', false)).to.eql('moose');
        expect(pluralize('orange', false)).to.eql('orange');
    });
});
