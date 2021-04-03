import * as http from 'http';
import * as https from 'https';

export type ServiceStartFunc = { (): (Promise<void> | Promise<boolean>) }
export type ServiceListenFunc = { (webServer: http.Server | https.Server): Promise<void> }
export type ServiceStopFunc = { (): Promise<void> }

export interface ServiceT {
  start: ServiceStartFunc,
  listen?: ServiceListenFunc,
  stop?: ServiceStopFunc
}
