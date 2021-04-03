import { AsyncLocalStorage } from 'async_hooks';
import { ServerMetadata } from '../metadata/server/server';
import { Service } from '../decorators/services/service.decorator';

export type NamespaceContext = {
  parent: NamespaceContext | null;
  [key: string]: unknown;
};

@Service()
export class ClsNamespaceService {
  constructor(
    private meta: ServerMetadata
  ) {
    this._name = `miter-cls-(${this.meta.name || ''})-${ClsNamespaceService.namespaceNum++}`;
    this._store = new AsyncLocalStorage();
  }

  async start() { }

  private static namespaceNum: number = 0;
  private _name: string;
  private _store: AsyncLocalStorage<NamespaceContext>;

  get name() {
    return this._name;
  }

  get activeContext(): NamespaceContext | null {
    return this._store.getStore() || null;
  }

  get<T>(key: string): T | undefined {
    let ctx = this.activeContext;
    while (ctx) {
      if (typeof ctx[key] !== 'undefined') return ctx[key] as T | undefined;
    }
    return undefined;
  }
  set<T>(key: string, val: T) {
    let ctx = this.activeContext;
    if (!ctx) throw new Error(`Can't set a value: there is no active context!`);
    ctx[key] = val;
  }

  run<T = void>(callback: (...args: any[]) => T): T {
    let newCtx = { parent: this.activeContext } as NamespaceContext;
    return this._store.run<T>(newCtx, callback);
  }
}
