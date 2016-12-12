import * as Sql from 'sequelize';
import { AssociationMetadata } from './association';

export interface HasOneMetadata extends Sql.AssociationOptionsHasOne, AssociationMetadata { };

export const ModelHasOneAssociationsSym = Symbol.for('ModelHasOneAssociations');
export const HasOneMetadataSym = Symbol.for('HasOneMetadata');
