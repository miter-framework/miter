

export type HasOneMetadata = {
    columnName?: string,
    
    foreignKey?: string,
    foreignTableName?: string
};

export const ModelHasOneAssociationsSym = Symbol.for('ModelHasOneAssociations');
export const HasOneMetadataSym = Symbol.for('HasOneMetadata');
