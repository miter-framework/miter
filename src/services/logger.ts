import { LogLevel } from '../metadata';
import { clc } from '../util';
import * as fs from 'fs';
import * as path from 'path';

export class Logger {
    constructor(serverName: string | null, logLevel: any) {
        this._serverName = serverName;
        if (typeof logLevel === 'undefined') logLevel = { default: 'info' };
        if (typeof logLevel === 'string') logLevel = { default: logLevel };
        this.logLevel = logLevel;
        
        let logPath = !!serverName ? `log/${serverName}` : `log`;
        try {
            logPath.split('/').forEach((dir, index, splits) => {
                let partialPath = path.resolve(splits.splice(0, index).join('/'), dir);
                if (!fs.existsSync(partialPath)) fs.mkdirSync(partialPath);
            });
        }
        catch(e) { console.error(e); }
        this.fd = fs.openSync(`${logPath}/${serverName}.${new Date().getTime()}.log`, 'w');
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
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}]: ${message}`);
        console.log(this.logLabelMessage(subsystem), message, ...optionalParams);
    }
    trace(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}]: ${message}`);
        console.trace(this.logLabelMessage(subsystem), message, ...optionalParams);
    }
    
    error(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}] error: ${message}`);
        console.error(this.logLabelMessage(subsystem), clc.error(`error:`), message, ...optionalParams);
    }
    info(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}] info: ${message}`);
        if (!this.logLevelCheck(subsystem, 'info')) return;
        console.info(this.logLabelMessage(subsystem), clc.info(`info:`), message, ...optionalParams);
    }
    warn(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}] warn: ${message}`);
        if (!this.logLevelCheck(subsystem, 'warn')) return;
        console.warn(this.logLabelMessage(subsystem), clc.warn(`warn:`), message, ...optionalParams);
    }
    verbose(subsystem: string | null, message?: any, ...optionalParams: any[]): void {
        this.writeToFile(`[${new Date().toISOString()}:${subsystem}] verbose: ${message}`);
        if (!this.logLevelCheck(subsystem, 'verbose')) return;
        console.log(this.logLabelMessage(subsystem), 'verbose:', message, ...optionalParams);
    }
}
