import { AssociationMetadata } from './association';

export interface HasManyMetadata extends AssociationMetadata {
    foreignKey?: string,
    as?: string | { singular: string, plural: string },
    onDelete?: 'SET NULL' | 'CASCADE'
};

export const ModelHasManyAssociationsSym = Symbol.for('ModelHasManyAssociations');
export const HasManyMetadataSym = Symbol.for('HasManyMetadata');
