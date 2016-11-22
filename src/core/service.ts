

export type ServiceStartFunc = { (): (Promise<void> | Promise<boolean>) }
export type ServiceStopFunc = { (): Promise<void> }

export interface ServiceT {
    start?: ServiceStartFunc,
    stop?: ServiceStopFunc
}
