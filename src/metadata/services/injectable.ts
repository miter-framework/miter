import { CallbackSource } from '../server/provide';

export type InjectableMetadata<T> = {
    provide?: CallbackSource<T>
}
export const InjectableMetadataSym = Symbol.for('InjectableMetadata');
