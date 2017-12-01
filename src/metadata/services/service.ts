import { InjectableMetadata } from './injectable';

export type ServiceMetadata = InjectableMetadata<any> & {
    restriction?: 'service'
};
export const ServiceMetadataSym = Symbol.for('ServiceMetadata');
