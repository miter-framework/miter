import { InjectableMetadata } from './injectable';

export type ServiceMetadata = InjectableMetadata<any> & { };
export const ServiceMetadataSym = Symbol.for('ServiceMetadata');
