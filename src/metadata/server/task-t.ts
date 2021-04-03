import * as express from 'express';

import { Server } from '../../server/server';

import { CtorT } from '../../core/ctor';
import { ServiceT } from '../../core/service';

import { ProvideMetadata } from './provide';

import { LogLevel } from './server-t';

export type Task = (server: Server, ...args: string[]) => Promise<void>;

export type TaskMetadataT = {
  task: Task,
  name?: string,
  inject?: ProvideMetadata<any>[],
  services?: CtorT<ServiceT>[],
  logLevel?: LogLevel | { [name: string]: LogLevel }
};
