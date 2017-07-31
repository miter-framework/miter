import { cout } from './cout';

export const directLogger = {
    clearLine: () => {
        cout.clearLine('left');
        cout.cursorTo(0, <any>undefined);
    },
    log: (message?: any, ...args: any[]) => console.log(message, ...args),
    info: (message?: any, ...args: any[]) => console.info(message, ...args),
    warn: (message?: any, ...args: any[]) => console.warn(message, ...args),
    error: (message?: any, ...args: any[]) => console.error(message, ...args),
    trace: (message?: any, ...args: any[]) => console.trace(message, ...args)
};
