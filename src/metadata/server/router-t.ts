import { Handler } from 'express';
import { PolicyDescriptor } from '../../core/policy';
import { CtorT } from '../../core/ctor';
import { ControllerT } from '../../core/controller';

export interface RouterMetadataT {
  path?: string,
  middleware?: Handler[],
  policies?: PolicyDescriptor[],
  controllers?: CtorT<ControllerT>[]
};
