

export function wrapPromise<T>(fn: Function, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
        fn(...args, (err: any, t: T) => {
            if (err) reject(err);
            else resolve(t);
        });
    });
}
