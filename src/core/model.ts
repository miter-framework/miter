import { Db } from './db';
import { CtorT } from './ctor';

export type PkType = number | string;

export interface ModelT<T extends PkType> {
   id: T;
}
export interface StaticModelT<T extends ModelT<PkType>> extends CtorT<T> {
   db: Db<T>
}

export * from './db';
