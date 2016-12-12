import * as Sql from 'sequelize';
import { AssociationMetadata } from './association';

export interface BelongsToMetadata extends Sql.AssociationOptionsBelongsTo, AssociationMetadata { };

export const ModelBelongsToAssociationsSym = Symbol.for('ModelBelongsToAssociations');
export const BelongsToMetadataSym = Symbol.for('BelongsToMetadata');
