

export type CallbackDone<T> = { (err: any, user: T | undefined): void };
export type AsyncPromiseFn<T> = { (...args: any[]): Promise<T> };

export function wrapCallback<T>(promiseFn: AsyncPromiseFn<T>) {
    return function(...allArgs: any[]) {
        let done = allArgs[allArgs.length - 1];
        let args = allArgs.splice(0, allArgs.length - 1);
        promiseFn(...args)
          .catch(err => done(err, undefined))
          .then(result => done(undefined, result));
    }
}
