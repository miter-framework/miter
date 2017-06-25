import { CtorT } from '../../core/ctor';

export type SimpleDependencySource = CtorT<any> | string;
export type DependencySource = SimpleDependencySource | (() => SimpleDependencySource);

export type CallbackSource<T> = { useCallback: { (...args: any[]): T }, cache?: boolean, deps?: DependencySource[] };
export type ValueSource<T> = { useValue: T };
export type ClassSource<T, TImpl extends T> = { useClass: CtorT<TImpl> };

export type ProvideMetadataSelector<T> = { provide: CtorT<T> };

export type ProvideMetadataCallbackSource<T> = ProvideMetadataSelector<T> & CallbackSource<T>;
export type ProvideMetadataValueSource<T> = ProvideMetadataSelector<T> & ValueSource<T>;
export type ProvideMetadataClassSource<T, TImpl extends T> = ProvideMetadataSelector<T> & ClassSource<T, TImpl>;

export type ProvideMetadata<T> = ProvideMetadataClassSource<T, any> | ProvideMetadataValueSource<T> | ProvideMetadataCallbackSource<T>;
