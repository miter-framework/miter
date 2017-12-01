import { CallbackSource } from '../server/provide';

export type InjectRestrictionT = 'none' | 'service';

export type InjectableMetadata<T> = {
    provide?: CallbackSource<T>,
    restriction?: InjectRestrictionT
};
export const InjectableMetadataSym = Symbol.for('InjectableMetadata');
