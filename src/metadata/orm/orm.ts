

export type DatabaseMetadata = {
    name: string,
    user: string,
    password: string,
    host: string | { domain: string, port: number },
    dialect?: string,
    pool?: {
        max?: number,
        min?: number,
        idle?: number
    }
}

export type OrmMetadata = {
    enabled?: boolean,
    db?: DatabaseMetadata,
    recreate?: boolean
}
