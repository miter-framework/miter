import { InjectableMetadata } from '../services/injectable';
import { PolicyDescriptor } from '../../core/policy';

export type PolicyMetadata = InjectableMetadata<any> & {
  policies?: PolicyDescriptor[]
};
export const PolicyMetadataSym = Symbol.for('PolicyMetadata');
