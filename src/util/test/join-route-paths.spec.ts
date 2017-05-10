/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { joinRoutePaths } from '../join-route-paths';

describe('util/joinRoutePaths', () => {
    it('should return the root if no path segments are specified', () => {
        expect(joinRoutePaths()).to.eql('/');
    });
    
    it('should join all path segments with a single forward slash', () => {
        expect(joinRoutePaths('one', 'two', 'three')).to.eql('/one/two/three');
    });
    
    it('should strip duplicate forward slashes from path segments', () => {
        expect(joinRoutePaths('/one/', '/two/', '/three')).to.eql('/one/two/three');
    });
    
    it('should ignore empty path segments', () => {
        expect(joinRoutePaths('one', '', 'three')).to.eql('/one/three');
        expect(joinRoutePaths('', '', '')).to.eql('/');
    });
    
    it('should allow a single forward slash at the end of the path', () => {
        expect(joinRoutePaths('one', 'two', 'three/')).to.eql('/one/two/three/');
    });
});
