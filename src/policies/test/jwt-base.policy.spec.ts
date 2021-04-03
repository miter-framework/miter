/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { JwtBasePolicy } from '../jwt-base.policy';
import { Request, Response } from 'express';
import { LoggerCore } from '../../services/logger-core';
import { JwtMetadata } from '../../metadata/server/jwt';
import { FakeRequest } from '../../router/test/fake-request';
import { FakeResponse } from '../../router/test/fake-response';
import { HTTP_STATUS_UNAUTHORIZED } from '../../util/http-status-type';
import * as jwt from 'jsonwebtoken';

describe('JwtBasePolicy', () => {
  let ctor: (jwtMeta: any, credentialsRequired: boolean) => JwtBasePolicy;
  let jwtBasePolicy: JwtBasePolicy;
  const testSecret = 'abracadabra';
  const testJwt = {
    id: 2,
    username: 'a fake user!'
  };
  let req: Request;
  let res: Response;
  let headerStub: sinon.SinonStub | undefined;
  beforeEach(() => {
    let logger = new LoggerCore('abc', 'error', false);
    ctor = (jwtMeta: any, credentialsRequired: boolean) => {
      return jwtBasePolicy = new JwtBasePolicy(jwtMeta && new JwtMetadata(jwtMeta), logger, credentialsRequired);
    };
    req = FakeRequest();
    res = FakeResponse();
    headerStub = undefined;
  });
  function stubHeader(name: string, val: string) {
    if (!headerStub) {
      headerStub = sinon.stub(req, 'header');
    }
    headerStub.withArgs(name).returns(val);
    req.headers[name] = val;
    req.headers[name.toLowerCase()] = val;
  }

  describe('.property', () => {
    it(`should return 'jwt' by default`, () => {
      ctor({ secret: testSecret }, false);
      expect(jwtBasePolicy.property).to.eql('jwt');
    });
    it(`should return the value provided by the JwtMetadata`, () => {
      ctor({ secret: testSecret, tokenProperty: 'user' }, false);
      expect(jwtBasePolicy.property).to.eql('user');
    });
    it('should return undefined if jwtMeta is falsey', () => {
      ctor(null, false);
      expect(jwtBasePolicy.property).to.eql(undefined);
    });
  });

  describe('.credentialsRequired', () => {
    it(`should be the value passed into the constructor`, () => {
      ctor({ secret: testSecret }, true);
      expect(jwtBasePolicy.credentialsRequired).to.be.true;
      ctor({ secret: testSecret }, false);
      expect(jwtBasePolicy.credentialsRequired).to.be.false;
    });
  });

  describe('.handle', () => {
    describe('when jwtMeta is defined', () => {
      describe('when the jwt is null', () => {
        beforeEach(() => {
          ctor({ secret: testSecret }, false);
          sinon.stub(<any>jwtBasePolicy, 'getJwt').returns(Promise.resolve(null));
        });

        it('should not invoke fromJson', async () => {
          sinon.spy(<any>jwtBasePolicy, 'fromJson');
          await jwtBasePolicy.handle(req, res);
          expect((<any>jwtBasePolicy).fromJson).not.to.have.been.called;
        });
        it('should return null', async () => {
          let result = await jwtBasePolicy.handle(req, res);
          expect(result).to.be.null;
        });

        describe('when credentialsRequired = true', () => {
          beforeEach(() => jwtBasePolicy.credentialsRequired = true);
          it('should set the status to HTTP_STATUS_UNAUTHORIZED', async () => {
            await jwtBasePolicy.handle(req, res);
            expect(res.statusCode).to.eq(HTTP_STATUS_UNAUTHORIZED);
          });
        });

        describe('when credentialsRequired = false', () => {
          it('should not set the status if the jwt is null', async () => {
            await jwtBasePolicy.handle(req, res);
            expect(res.statusCode).to.eq(0);
          });
        });
      });

      describe('when the jwt is not null', () => {
        beforeEach(() => {
          ctor({ secret: testSecret }, false);
          sinon.stub(<any>jwtBasePolicy, 'getJwt').returns(Promise.resolve(testJwt));
        });

        it('should invoke fromJson with the jwt if it is not null', async () => {
          sinon.spy(<any>jwtBasePolicy, 'fromJson');
          await jwtBasePolicy.handle(req, res);
          expect((<any>jwtBasePolicy).fromJson).to.have.been.calledOnce.calledWith(testJwt);
        });
        it('should return the value returned by fromJson', async () => {
          let testValue = 'fish!';
          sinon.stub(<any>jwtBasePolicy, 'fromJson').returns(Promise.resolve(testValue));
          let result = await jwtBasePolicy.handle(req, res);
          expect(result).to.eq(testValue);
        });

        describe('when credentialsRequired = true', () => {
          beforeEach(() => jwtBasePolicy.credentialsRequired = true);
          it('should not set the status if the jwt is not null', async () => {
            await jwtBasePolicy.handle(req, res);
            expect(res.statusCode).to.eq(0);
          });
        });

        describe('when credentialsRequired = false', () => {
          it('should not set the status if the jwt is not null', async () => {
            await jwtBasePolicy.handle(req, res);
            expect(res.statusCode).to.eq(0);
          });
        });
      });
    });
  });

  describe('.getJwt', () => {
    let getJwt: (req: Request, res: Response) => Promise<any>;

    describe('when jwtMeta is undefined', () => {
      beforeEach(() => {
        ctor(undefined, false);
        getJwt = (<any>jwtBasePolicy).getJwt.bind(jwtBasePolicy);
      });
      it('should not invoke the jwt handler', async () => {
        if (!(<any>jwtBasePolicy).jwtHandler) return;
        sinon.stub(<any>jwtBasePolicy, 'jwtHandler');
        await getJwt(req, res);
        expect((<any>jwtBasePolicy).jwtHandler).not.to.have.been.called;
      });
      it('should return null', async () => {
        let result = await getJwt(req, res);
        expect(result).to.be.null;
      });
    });

    describe('when jwtMeta is defined', () => {
      beforeEach(() => {
        ctor({ secret: testSecret }, false);
        getJwt = (<any>jwtBasePolicy).getJwt.bind(jwtBasePolicy);
      });
      it('should invoke the jwtHandler', async () => {
        sinon.spy(<any>jwtBasePolicy, 'jwtHandler');
        await getJwt(req, res);
        expect((<any>jwtBasePolicy).jwtHandler).to.have.been.calledOnce;
      });
      it('should return null if there is no Authorization header', async () => {
        let result = await getJwt(req, res);
        expect(result).to.be.null;
      });
      it('should return null if the Authorization header is invalid', async () => {
        stubHeader('Authorization', 'Bearer HAHA, NOPE!');
        let result = await getJwt(req, res);
        expect(result).to.be.null;
      });
      it('should return the JWT json if the Authorization header is valid', async () => {
        let token = jwt.sign(testJwt, testSecret);
        stubHeader('Authorization', `Bearer ${token}`);
        let result = await getJwt(req, res);
        if (result.iat) delete result.iat;
        expect(result).to.deep.eq(testJwt);
      });
      it('should log verbose if the jwt handler throws an error', async () => {
        sinon.stub(<any>jwtBasePolicy, 'jwtHandler').throws('HAHA die!');
        let stub = sinon.stub((<any>jwtBasePolicy).logger, 'verbose');
        await getJwt(req, res);
        expect(stub).to.have.been.calledTwice;
      });
      it('should return null if the jwt handler throws an error', async () => {
        sinon.stub(<any>jwtBasePolicy, 'jwtHandler').throws('HAHA die!');
        let result = await getJwt(req, res);
        expect(result).to.be.null;
      });
    })
  });

  describe('.fromJson', () => {
    let fromJson: (json: any) => Promise<any>;
    beforeEach(() => {
      ctor({ secret: testSecret }, false);
      fromJson = (<any>jwtBasePolicy).fromJson.bind(jwtBasePolicy);
    });
    it('should return a promise', () => {
      expect(fromJson(null)).to.be.an.instanceOf(Promise);
    });
    describe('that promise', () => {
      it('should resolve to the same passed-in value', async () => {
        async function expectSame(val: any) {
          let result = await fromJson(val);
          expect(result).to.deep.eq(val);
        };
        await expectSame(null);
        await expectSame(undefined);
        await expectSame({});
        await expectSame({ id: 20, name: 'fake user!' });
      });
    });
  });
});
