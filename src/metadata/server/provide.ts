import { CtorT } from '../../core';

export type ProvideMetadataCallbackSource<T> = { provide: CtorT<T>, useCallback: { (): T } };
export type ProvideMetadataValueSource<T> = { provide: CtorT<T>, useValue: T };
export type ProvideMetadataClassSource<T, TImpl extends T> = { provide: CtorT<T>, useClass: CtorT<TImpl> }; 

export type ProvideMetadata<T> = ProvideMetadataClassSource<T, any> | ProvideMetadataValueSource<T> | ProvideMetadataCallbackSource<T>;
