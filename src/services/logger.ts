import { Server } from '../server/server';
import { LogLevel } from '../metadata';
import { clc } from '../util/clc';
import * as fs from 'fs';

export class Logger {
    constructor(serverName: string | null, logLevel: any) {
        this._serverName = serverName;
        if (typeof logLevel === 'undefined') logLevel = { default: 'info' };
        if (typeof logLevel === 'string') logLevel = { default: logLevel };
        this.logLevel = logLevel;
        
        try { fs.mkdirSync(`log`, 'w'); }
        catch(e) {}
        this.fd = fs.openSync(`log/${serverName}.${new Date().getTime()}.log`, 'w');
    }
    
    private fd: number;
    
    private logLevel: { [name: string]: LogLevel };
    
    public ShutDown() {
        fs.close(this.fd);
    }
    
    private _serverName: string | null;
    get serverName(): string | null {
        return this._serverName;
    }
    private logLabelMessage(subsystem: string | null) {
        if (!this.serverName && !subsystem) return '';
        else if (!this.serverName) return clc.white(`[${subsystem}]`);
        else if (!subsystem) return clc.white(`[${clc.bold(clc.yellow(this.serverName))}]`);
        else return clc.white(`[${clc.bold(clc.yellow(this.serverName))}:${subsystem}]`);
    }
    
    private logLevelCheck(subsystem: string | null, logLevel: LogLevel) {
        let allowedLevel = (subsystem && this.logLevel[subsystem]) || this.logLevel['default'];
        switch (allowedLevel) {
        case 'verbose':
            return true;
        case 'info':
            return logLevel !== 'verbose';
        case 'warn':
            return logLevel === 'warn' || logLevel === 'error';
        case 'error':
            return logLevel === 'error';
        }
    }
    
    private writeToFile(message: string) {
        fs.write(this.fd, message + "\n", () => {});
    }
    
    log(subsystem: string | null, message?: any, ...optionalParams: any[]): void { 
        console.log(this.logLabelMessage(subsystem), message, ...optionalParams);
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}]: ${message}`);
    }
    trace(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        console.trace(this.logLabelMessage(subsystem), message, ...optionalParams);
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}]: ${message}`);
    }
    
    error(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        // if (typeof message === 'string') message = clc.error(message);
        console.error(this.logLabelMessage(subsystem), clc.error(`error:`), message, ...optionalParams);
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}] error: ${message}`);
    }
    info(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (!this.logLevelCheck(subsystem, 'info')) return;
        // if (typeof message === 'string') message = clc.info(message);
        console.info(this.logLabelMessage(subsystem), clc.info(`info:`), message, ...optionalParams);
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}] info: ${message}`);
    }
    warn(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (!this.logLevelCheck(subsystem, 'warn')) return;
        // if (typeof message === 'string') message = clc.warn(message);
        console.warn(this.logLabelMessage(subsystem), clc.warn(`warn:`), message, ...optionalParams);
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}] warn: ${message}`);
    }
    verbose(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        if (!this.logLevelCheck(subsystem, 'verbose')) return;
        console.log(this.logLabelMessage(subsystem), 'verbose:', message, ...optionalParams);
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}] verbose: ${message}`);
    }
}
