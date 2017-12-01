import { CtorT } from '../../core/ctor';
import { ServiceT } from '../../core/service';

import { OrmMetadataT } from './orm-t';
import { SSLMetadataT } from './ssl-t';
import { RouterMetadataT } from './router-t';
import { ViewsMetadataT } from './views-t';

import { ProvideMetadata } from './provide';

import { JwtMetadataT } from './jwt-t';

export type LogLevel = 'verbose' | 'warn' | 'info' | 'error';

export interface ServerMetadataT {
    name: string,
    
    port?: number | string,
    allowCrossOrigin?: boolean,
    ssl?: SSLMetadataT,
    router?: RouterMetadataT | null,
    
    orm?: OrmMetadataT,
    
    services?: CtorT<ServiceT>[],
    views?: ViewsMetadataT | null,
    
    inject?: ProvideMetadata<any>[],
    
    //TODO: generalize these properties, along with Task
    jwt?: JwtMetadataT | null,
    logLevel?: LogLevel | { [name: string]: LogLevel },
    debugBreakpoint?: () => void
};
