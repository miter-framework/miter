

export type Charset = 'utf8' | 'utf8mb4';

export type DatabaseMetadataT = {
    name: string,
    user: string,
    password: string,
    host: string | { domain: string, port?: number },
    dialect?: string,
    charset?: Charset,
    pool?: {
        min?: number,
        max?: number,
        idle?: number
    }
};
