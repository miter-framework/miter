import { createNamespace, Namespace, Context } from 'continuation-local-storage';
import { ServerMetadata } from '../metadata/server/server';
import { Service } from '../decorators/services/service.decorator';

@Service()
export class ClsNamespaceService {
  constructor(
    private meta: ServerMetadata
  ) {
    let _name = `miter-cls-(${this.meta.name || ''})-${ClsNamespaceService.namespaceNum++}`;
    this._namespace = createNamespace(_name);
  }

  async start() { }

  private static namespaceNum: number = 0;
  private _namespace: Namespace;

  get name() {
    return this._namespace.name;
  }

  get activeContext() {
    return this.active;
  }
  get active() {
    return this._namespace.active;
  }
  createContext() {
    return this._namespace.createContext();
  }

  get(key: string) {
    return this._namespace.get(key);
  }
  set<T>(key: string, val: T) {
    this._namespace.set(key, val);
  }

  run<T = void>(callback: (...args: any[]) => T) {
    return this._namespace.run(callback);
  }
  runAndReturn<T = void>(callback: (...args: any[]) => T): T {
    return this._namespace.runAndReturn(callback);
  }
  bind(callback: any, context?: Context) {
    return this._namespace.bind(callback, context);
  }
  bindEmitter(emitter: NodeJS.EventEmitter) {
    return this._namespace.bindEmitter(emitter);
  }
}
