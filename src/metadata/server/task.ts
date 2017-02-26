import * as express from 'express';

import { Server } from '../../server/server';

import { CtorT } from '../../core/ctor';
import { StaticModelT, ModelT, PkType } from '../../core/model';
import { ServiceT } from '../../core/service';

import { OrmMetadata } from '../orm/orm';
import { ProvideMetadata } from './provide';

import { LogLevel } from './server';

export type Task = (server: Server, ...args: string[]) => Promise<void>;

export type TaskMetadata = {
    task: Task,
    name?: string,
    orm?: OrmMetadata,
    inject?: ProvideMetadata<any>[],
    models?: StaticModelT<ModelT<PkType>>[],
    services?: CtorT<ServiceT>[],
    logLevel?: LogLevel | { [name: string]: LogLevel }
}