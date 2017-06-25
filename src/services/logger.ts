import { Injectable } from '../decorators/services/injectable.decorator';
import { LoggerCore } from './logger-core';

@Injectable({
    provide: {
        useCallback: Logger.fromSubsystem,
        deps: [() => LoggerCore, 'name']
    }
})
export class Logger {
    constructor(private core: LoggerCore, private subsystem: string) {
    }
    
    static fromSubsystem(core: LoggerCore, subsystem: string) {
        return core.getSubsystem(subsystem);
    }
    
    log(message?: any, ...optionalParams: any[]): void {
        this.core.log(this.subsystem, message, ...optionalParams);
    }
    trace(message?: any, ...optionalParams: any[]): void {
        this.core.trace(this.subsystem, message, ...optionalParams);
    }
    
    error(message?: any, ...optionalParams: any[]): void {
        this.core.error(this.subsystem, message, ...optionalParams);
    }
    info(message?: any, ...optionalParams: any[]): void {
        this.core.info(this.subsystem, message, ...optionalParams);
    }
    warn(message?: any, ...optionalParams: any[]): void {
        this.core.warn(this.subsystem, message, ...optionalParams);
    }
    verbose(message?: any, ...optionalParams: any[]): void {
        this.core.verbose(this.subsystem, message, ...optionalParams);
    }
}
