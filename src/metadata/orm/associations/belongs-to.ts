

export type BelongsToMetadata = {
   columnName?: string,
   
   foreignKey?: string,
   foreignTableName?: string
};

export const ModelBelongsToAssociationsSym = Symbol.for('ModelBelongsToAssociations');
export const BelongsToMetadataSym = Symbol.for('BelongsToMetadata');
