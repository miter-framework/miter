

export type DatabaseMetadata = {
   name: string,
   user: string,
   password: string,
   host: string | { domain: string, port: number },
   dialect?: string
}

export type OrmMetadata = {
   enabled?: boolean,
   db?: DatabaseMetadata
}
