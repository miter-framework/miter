import { CtorT } from '../core/ctor';
import { PolicyT } from '../core/policy';
import { Errback } from 'express';

declare module 'express' {
    interface Request {
        policyResults<T>(policy: CtorT<PolicyT<T>>): T | undefined;
        jwt: any;
    }
    interface Response {
        sendFile(path: string): Promise<void>;
        sendFile(path: string, options: any): Promise<void>;
        sendFile(path: string, fn: { (err: Error): void }): void;
        sendFile(path: string, options: any, fn: { (err: Error): void }): void;
        
        sendfile(path: string): Promise<void>;
        sendfile(path: string, options: any): Promise<void>;
        sendfile(path: string, fn: { (err: Error): void }): void;
        sendfile(path: string, options: any, fn: { (err: Error): void }): void;
    }
}
