import * as Sql from 'sequelize';
import { TransactionT } from './transaction';

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
    create(t: (T | Object)[]): Promise<boolean>;
    create(t: T | Object): Promise<T>;
    
    findById(id: string | number, options?: QueryT): Promise<T | null>;
    findOne(query: QueryT): Promise<T | null>;
    findOrCreate(query: string | Sql.WhereOptions, defaults?: Object | T): Promise<[T, boolean]>;
    findAndCountAll(query?: QueryT): Promise<CountAllResults<T>>;
    findAll(query?: QueryT): Promise<T[]>;
    all(query?: QueryT): Promise<T[]>;
    count(query?: CountQueryT): Promise<number>;
    
    max<T>(field: string): Promise<T>;
    min<T>(field: string): Promise<T>;
    sum<T>(field: string): Promise<T>;
    
    save(t: T): Promise<T>;
    update(id: number | string, replace: Object, returning?: boolean): Promise<[boolean | number, any]>;
    update(t: T, replace: Object, returning?: boolean): Promise<[boolean | number, any]>;
    update(query: UpdateQueryT, replace: Object, returning?: boolean): Promise<[boolean | number, any]>;
    updateOrCreate(query: string | Sql.WhereOptions, defaults: Object | T) : Promise<[T, boolean]>;
    
    destroy(id: string | number): Promise<boolean>;
    destroy(t: T): Promise<boolean>;
    destroy(query: DestroyQueryT): Promise<number>;
    
    fromJson(json: any): T;
}
