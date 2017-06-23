/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { inhertitanceHierarchy } from '../inheritance-hierarchy';

describe('util/inhertitanceHierarchy', () => {
    it('should return an array with all OOP ancestors for a class', () => {
        class A { }
        class B extends A { }
        class C extends B { }
        class D extends C { }
        
        expect(inhertitanceHierarchy(A).splice(1)).to.be.deep.eq([A]);
        expect(inhertitanceHierarchy(B).splice(1)).to.be.deep.eq([A, B]);
        expect(inhertitanceHierarchy(C).splice(1)).to.be.deep.eq([A, B, C]);
        expect(inhertitanceHierarchy(D).splice(1)).to.be.deep.eq([A, B, C, D]);
    });
});
