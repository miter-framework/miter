/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { ClsNamespaceService } from '../cls-namespace.service';
import { ServerMetadata } from '../../metadata/server/server';

const testServerMeta = new ServerMetadata({ name: 'abc-xyz' });

function delay(millis: number) {
  return new Promise((resolve, _) => {
    setTimeout(resolve, millis);
  });
}

describe('ClsNamespaceService', () => {
  let instance: ClsNamespaceService;
  before(() => instance = new ClsNamespaceService(testServerMeta));

  describe('.name', () => {
    it('should include the server name in its namespace name', () => {
      expect(instance.name).to.contain(testServerMeta.name);
    });
  });

  describe('.run', async () => {
    it('should create a local storage that is accessable asynchronously', async () => {
      expect(instance.get('key')).not.to.be.ok;
      await instance.run(async () => {
        instance.set('key', 'value1');
        expect(instance.get('key')).to.eq('value1');
        await delay(20);
        expect(instance.get('key')).to.eq('value1');
      });
      expect(instance.get('key')).not.to.be.ok;
    });
    it('should return the result of running the function', async () => {
      let result = await instance.run(async () => {
        await delay(20);
        return 42;
      });
      expect(result).to.eq(42);
    });
  });
});
