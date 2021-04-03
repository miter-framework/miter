import { TransactionT } from '../../core/transaction';
import { ModelT } from '../../core/model';

class MyClass {
  id: number;

  name: string;

  static db: any;
}

export interface WherePGStatement {
  $any: Array<string | number>;
  $all: Array<string | number>;
}

export type WhereLogic = Partial<{
  $ne: string | number | WhereLogic;
  $in: Array<string | number>;
  $not: boolean | string | number;
  $notIn: Array<string | number>;
  $gte: number | string | Date;
  $gt: number | string | Date;
  $lte: number | string | Date;
  $lt: number | string | Date;
  $like: string | WherePGStatement;
  $iLike: string | WherePGStatement;
  $ilike: string | WherePGStatement;
  $notLike: string | WherePGStatement;
  $notILike: string | WherePGStatement;
  $between: [number, number];
  "..": [number, number];
  $notBetween: [number, number];
  "!..": [number, number];
  $overlap: [number, number];
  "&&": [number, number];
  $contains: any;
  "@>": any;
  $contained: any;
  "<@": any;
}>;

export type WhereClauseSimpleValue<T> = T | null;
export type WhereClauseComplexValue<T> =
    { $not: WhereClauseSimpleValue<T> }
    | { $in: WhereClauseSimpleValue<T>[] }
    | { $notIn: WhereClauseSimpleValue<T>[] }
    | { $gt: T } //...when T extends number, Date
    | { $gte: T } //...when T extends number, Date
    | { $lt: T } //...when T extends number, Date
    | { $lte: T } //...when T extends number, Date
    | { $between: [T, T] } //...when T extends number, Date
    | { $notBetween: [T, T] } //...when T extends number, Date
    | { $like: string } //...when T extends string
    | WhereClauseT<T>; //...when T extends ModelT<any>
export type WhereClauseValueT<T> = WhereClauseSimpleValue<T> | WhereClauseComplexValue<T>;
export type WhereClauseT<T> = { //T extends ModelT<any>
  [K in keyof(T)]?: WhereClauseValueT<T[K]>
} & {
  $and?: WhereClauseT<T>[]
  $or?: WhereClauseT<T>[]
};
export type WhereOptions<T> = WhereClauseT<T>;

export type IncludeClauseT<T> = string[];
export type OrderingT<T> = [keyof(T), 'ASC' | 'DESC'];
export type OrderClauseT<T> = OrderingT<T>[];
export type QueryT<T> = {
  where?: WhereClauseT<T>,
  include?: IncludeClauseT<T>,
  order?: OrderClauseT<T>,
  limit?: number,
  offset?: number,
  transaction?: TransactionT
}

type WhereMyClass = WhereClauseT<MyClass>;

export type DefaultsClauseT<T> = {
  [K in keyof(T)]: T[K] | null
};
export interface FindOrCreateQueryT<T> extends QueryT<T> {
  defaults?: DefaultsClauseT<T>
}

export type CountQueryT<T> = {
  where?: WhereClauseT<T>,
  include?: IncludeClauseT<T>,
  transaction?: TransactionT
};

export type DestroyQueryT<T> = {
  where?: WhereClauseT<T>,
  limit?: number
};
