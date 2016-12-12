import * as Sql from 'sequelize';
import { AssociationMetadata } from './association';

export interface HasManyMetadata extends Sql.AssociationOptionsHasMany, AssociationMetadata { };

export const ModelHasManyAssociationsSym = Symbol.for('ModelHasManyAssociations');
export const HasManyMetadataSym = Symbol.for('HasManyMetadata');
