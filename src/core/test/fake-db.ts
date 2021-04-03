import { Db } from '../../core/db';

export class FakeDb<T> implements Db<T> {
  async create(t: any) { return t; }
  async findById(id: string | number, options?: any): Promise<T | null> { return null; }
  async findOne(query: any): Promise<T | null> { return null; }
  async findOrCreate(query: any, defaults?: Object | T | undefined): Promise<[T, boolean]> { return [<any>defaults, true]; }
  async findAndCountAll(query?: any): Promise<any> { return <any>void(0); }
  async findAll(query?: any): Promise<T[]> { return []; }
  async all(query?: any): Promise<T[]> { return []; }
  async count(query?: any): Promise<number> { return 0; }
  async max<T>(field: string): Promise<number> { return 0; }
  async min<T>(field: string): Promise<number> { return 0; }
  async sum<T>(field: string): Promise<number> { return 0; }
  async save(t: T): Promise<T> { return t; }
  async update(query: any, replace: any, returning?: any) { return <any>void(0); }
  async updateOrCreate(query: any, defaults: Object | T): Promise<[T, boolean]> { return [<any>defaults, true]; }
  async destroy(query: any) { return <any>void(0); }
  fromJson(json: any): T { return <any>json; }
}
