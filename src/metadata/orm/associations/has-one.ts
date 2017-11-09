import { AssociationMetadata } from './association';

export interface HasOneMetadata extends AssociationMetadata {
    foreignKey?: string,
    as?: string | { singular: string, plural: string },
    onDelete?: 'SET NULL' | 'CASCADE'
};

export const ModelHasOneAssociationsSym = Symbol.for('ModelHasOneAssociations');
export const HasOneMetadataSym = Symbol.for('HasOneMetadata');
