import { CtorT } from '../../core/ctor';

export type ProvideMetadataCallbackSource<T> = { provide: CtorT<T>, useCallback: { (...args: any[]): T }, cache?: boolean, deps?: CtorT<any>[] };
export type ProvideMetadataValueSource<T> = { provide: CtorT<T>, useValue: T };
export type ProvideMetadataClassSource<T, TImpl extends T> = { provide: CtorT<T>, useClass: CtorT<TImpl> };

export type ProvideMetadata<T> = ProvideMetadataClassSource<T, any> | ProvideMetadataValueSource<T> | ProvideMetadataCallbackSource<T>;
