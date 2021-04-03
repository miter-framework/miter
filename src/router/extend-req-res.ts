import { CtorT } from '../core/ctor';
import { PolicyT } from '../core/policy';
import { Request, Response, Errback } from 'express';

declare module 'express' {
  interface Request {
    policyResults<T>(policy: CtorT<PolicyT<T>>): T | undefined;
    jwt: any;

    requestIndex: number;
    routeMethodName: string;
  }
  interface Response {
    sendFile(path: string): Promise<void>;
    sendFile(path: string, options: any): Promise<void>;

    //TODO: figure out why Typescript errors when I try to give req the "Request" type
    sendFiles(req: any, path: string): Promise<boolean>;
    sendFiles(req: any, path: string, options: any): Promise<boolean>;

    //Deprecated
    sendFile(path: string, fn: { (err: Error): void }): void;
    sendFile(path: string, options: any, fn: { (err: Error): void }): void;

    sendfile(path: string): Promise<void>;
    sendfile(path: string, options: any): Promise<void>;
    sendfile(path: string, fn: { (err: Error): void }): void;
    sendfile(path: string, options: any, fn: { (err: Error): void }): void;
  }
}
