import { Service } from '../decorators/services/service.decorator';
import { Name } from '../decorators/services/name.decorator';
import { Server } from '../server/server';
import { ServerMetadata } from '../metadata/server/server';
import { Logger } from './logger';
import { cin } from '../util/cin';
import { cout } from '../util/cout';
import { directLogger } from '../util/direct-logger';
import { delay } from '../util/delay';
import vm = require('vm');

const ELLIPSIS_CHANGE_MILLIS = 50;

@Service()
@Name('repl')
export class ReplService {
  constructor(
    private server: Server,
    private logger: Logger,
    private meta: ServerMetadata,
  ) { }

  private context: vm.Context;
  private loopPromise: Promise<void>;

  async start() {
    this.makeContext();
    cin.getNative();
    this.loopPromise = this.repl();
  }

  private makeContext() {
    this.context = vm.createContext();
    let services = this.meta.services;
    if (services) {
      for (let q = 0; q < services.length; q++) {
        (<any>this.context)[services[q].name] = this.server.injector.resolveInjectable(services[q]);
      }
    }
    (<any>this.context)['Server'] = this.server;
    (<any>this.context)['Injector'] = this.server.injector;
    (<any>this.context)['logger'] = this.logger;
    (<any>this.context)['delay'] = delay;
    (<any>this.context)['require'] = require;
  }
  private async resolvePromise(promise: Promise<any>) {
    cin.pause();
    let resolved = false, error = false;
    let result: any;
    promise.then(val => {
      resolved = true;
      result = val;
    }, err => {
      error = true;
      result = err;
    });
    let ticks = 0;
    while (!resolved && !error) {
      // tslint:disable:no-magic-numbers
      let dots = (ticks / 5) % 4;
      let line = `Resolving${'.'.repeat(dots)}`;
      cout.write(line);
      await delay(ELLIPSIS_CHANGE_MILLIS);
      cout.clearLine();
      cout.moveCursor(-line.length, 0);
      ticks++;
    }
    cin.resume();
    if (error) throw result;
    return result;
  }
  private async execute(code: string) {
    try {
      let script = new vm.Script(code);
      let result = script.runInContext(this.context);
      if (result && result.then) result = await this.resolvePromise(result);
      directLogger.log(result);
    }
    catch (e) {
      this.logger.error(e && (e.message || e));
    }
  }

  private async repl() {
    while (true) {
      let line = await cin.readline();
      if (line == 'exit') break;
      await this.execute(line);
    }
  }

  async stop() {
    cin.emit('exit');
    await this.loopPromise;
  }
}
