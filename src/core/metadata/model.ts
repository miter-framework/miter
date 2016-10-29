

export type ModelMetadata = {
   tableName: string,
   freezeTableName?: boolean,
   
   timestamps?: boolean,
   createdAt?: boolean | string,
   updatedAt?: boolean | string,
   
   paranoid?: boolean,
   deletedAt?: boolean | string,
   
   underscored?: boolean,
   comment?: string,
   engine?: string
}
export const ModelMetadataSym = Symbol.for('ControllerMetadata');
export const ModelPropertiesSym = Symbol.for('ModelProperties');
