import { TransactionT } from './transaction';
import { QueryT, FindOrCreateQueryT, CountQueryT, DestroyQueryT, WhereOptions } from '../metadata/orm/query';

export interface CountAllResults<T> {
    count: number;
    results: T[];
    page?: number;
    perPage?: number;
};
export interface Db<T> {
    // create(t: (T | Object)[]): Promise<T[]>;
    create(t: (T | Object)[]): Promise<boolean>;
    create(t: T | Object): Promise<T>;
    
    findById(id: string | number, options?: QueryT<T>): Promise<T | null>;
    findOne(query: QueryT<T>): Promise<T | null>;
    findOrCreate(query: string | WhereOptions<T>, defaults?: Object | T): Promise<[T, boolean]>;
    findAndCountAll(query?: QueryT<T>): Promise<CountAllResults<T>>;
    findAll(query?: QueryT<T>): Promise<T[]>;
    all(query?: QueryT<T>): Promise<T[]>;
    count(query?: CountQueryT<T>): Promise<number>;
    
    max<T>(field: string): Promise<number>;
    min<T>(field: string): Promise<number>;
    sum<T>(field: string): Promise<number>;
    
    save(t: T): Promise<T>;
    update(id: number | string, replace: Object, returning?: boolean): Promise<[boolean | number, any]>;
    update(t: T, replace: Object, returning?: boolean): Promise<[boolean | number, any]>;
    update(query: QueryT<T>, replace: Object, returning?: boolean): Promise<[boolean | number, any]>;
    updateOrCreate(query: string | WhereOptions<T>, defaults: Object | T) : Promise<[T, boolean]>;
    
    destroy(id: string | number): Promise<boolean>;
    destroy(t: T): Promise<boolean>;
    destroy(query: DestroyQueryT<T>): Promise<number>;
    
    fromJson(json: any): T;
}
