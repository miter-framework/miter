import * as Sql from 'sequelize';
import { Transaction } from './transaction';

export type QueryT = Sql.FindOptions;
export type FindOrCreateQueryT = Sql.FindOrInitializeOptions<any>;
export type CountQueryT = Sql.CountOptions;
export type UpdateQueryT = Sql.UpdateOptions;
export type DestroyQueryT = Sql.DestroyOptions;

export interface CountAllResults<T> {
    count: number;
    results: T[]
};
export interface Db<T> {
    // create(t: (T | Object)[]): Promise<T[]>;
    create(t: (T | Object)[], transaction?: Transaction): Promise<boolean>;
    create(t: T | Object, transaction?: Transaction): Promise<T>;
    
    findById(id: string | number, options?: QueryT, transaction?: Transaction): Promise<T | null>;
    findOne(query: QueryT, transaction?: Transaction): Promise<T | null>;
    findOrCreate(query: string | Sql.WhereOptions, defaults?: Object | T, transaction?: Transaction): Promise<[T, boolean]>;
    findAndCountAll(query?: QueryT, transaction?: Transaction): Promise<CountAllResults<T>>;
    findAll(query?: QueryT, transaction?: Transaction): Promise<T[]>;
    all(query?: QueryT, transaction?: Transaction): Promise<T[]>;
    count(query?: CountQueryT, transaction?: Transaction): Promise<number>;
    
    max<T>(field: string, transaction?: Transaction): Promise<T>;
    min<T>(field: string, transaction?: Transaction): Promise<T>;
    sum<T>(field: string, transaction?: Transaction): Promise<T>;
    
    save(t: T, transaction?: Transaction): Promise<T>;
    update(id: number | string, replace: Object, returning?: boolean, transaction?: Transaction): Promise<[boolean | number, any]>;
    update(t: T, replace: Object, returning?: boolean, transaction?: Transaction): Promise<[boolean | number, any]>;
    update(query: UpdateQueryT, replace: Object, returning?: boolean, transaction?: Transaction): Promise<[boolean | number, any]>;
    updateOrCreate(query: string | Sql.WhereOptions, defaults: Object | T, transaction?: Transaction) : Promise<[T, boolean]>;
    
    destroy(id: string | number, transaction?: Transaction): Promise<boolean>;
    destroy(t: T, transaction?: Transaction): Promise<boolean>;
    destroy(query: DestroyQueryT, transaction?: Transaction): Promise<number>;
    
    fromJson(json: any): T;
}
