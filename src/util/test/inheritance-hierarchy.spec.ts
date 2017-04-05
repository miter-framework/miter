/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { inhertitanceHierarchy } from '../inheritance-hierarchy';

describe('util/inhertitanceHierarchy', () => {
    it('should return an array with all OOP ancestors for a class', () => {
        class A { }
        class B extends A {}
        class C extends B {}
        class D extends C {}
        
        expect(inhertitanceHierarchy(A)).to.be.deep.eq([A]);
        expect(inhertitanceHierarchy(B)).to.be.deep.eq([A, B]);
        expect(inhertitanceHierarchy(C)).to.be.deep.eq([A, B, C]);
        expect(inhertitanceHierarchy(D)).to.be.deep.eq([A, B, C, D]);
    });
});
