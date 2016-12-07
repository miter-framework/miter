import { Server } from '../server/server';
import { LogLevel } from '../metadata';
import { clc } from '../util/clc';

export class Logger {
    constructor(logLevel: any) {
        if (typeof logLevel === 'undefined') logLevel = { default: 'warn' };
        if (typeof logLevel === 'string') logLevel = { default: logLevel };
        this.logLevel = logLevel;
    }
    private logLevel: { [name: string]: LogLevel };
    
    private logLevelCheck(subsystem: string | null, logLevel: LogLevel) {
        let allowedLevel = (subsystem && this.logLevel[subsystem]) || this.logLevel['default'];
        switch (allowedLevel) {
        case 'trace':
            return true;
        case 'verbose':
            return logLevel !== 'trace';
        case 'warn':
            return logLevel !== 'trace' && logLevel !== 'verbose';
        case 'info':
            return logLevel === 'info' || logLevel === 'error';
        case 'error':
            return logLevel === 'error';
        }
    }
    
    log(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (subsystem) console.log(`[${subsystem}]`, message, ...optionalParams);
        else console.log(message, ...optionalParams);
    }
    error(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (typeof message === 'string') message = clc.error(message);
        if (subsystem) console.error(clc.error(`[${subsystem}]`), message, ...optionalParams);
        else console.error(message, ...optionalParams);
    }
    info(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (!this.logLevelCheck(subsystem, 'info')) return;
        if (typeof message === 'string') message = clc.info(message);
        if (subsystem) console.info(clc.info(`[${subsystem}]`), message, ...optionalParams);
        else console.info(message, ...optionalParams);
    }
    warn(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (!this.logLevelCheck(subsystem, 'warn')) return;
        if (typeof message === 'string') message = clc.warn(message);
        if (subsystem) console.warn(clc.warn(`[${subsystem}]`), message, ...optionalParams);
        else console.warn(message, ...optionalParams);
    }
    verbose(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (!this.logLevelCheck(subsystem, 'verbose')) return;
        if (subsystem) console.log(`[${subsystem}]`, 'verbose:', message, ...optionalParams);
        else console.log('verbose:', message, ...optionalParams);
    }
    trace(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (!this.logLevelCheck(subsystem, 'trace')) return;
        if (subsystem) console.trace(`[${subsystem}]`, message, ...optionalParams);
        else console.trace(message, ...optionalParams);
    }
}
