import { AssociationMetadata } from './association';

export interface BelongsToMetadata extends AssociationMetadata {
  foreignKey?: string,
  as?: string | { singular: string, plural: string },
  onDelete?: 'SET NULL' | 'CASCADE'
};

export const ModelBelongsToAssociationsSym = Symbol.for('ModelBelongsToAssociations');
export const BelongsToMetadataSym = Symbol.for('BelongsToMetadata');
