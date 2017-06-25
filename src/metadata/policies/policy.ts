import { InjectableMetadata } from '../services/injectable';

export type PolicyMetadata = InjectableMetadata<any> & {
    
}
export const PolicyMetadataSym = Symbol.for('PolicyMetadata');
