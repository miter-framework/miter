import * as Sql from 'sequelize';
import { StaticModelT, ModelT } from '../../../core';

export interface HasManyMetadata extends Sql.AssociationOptionsHasMany {
   foreignModel: StaticModelT<ModelT<any>>
};

export const ModelHasManyAssociationsSym = Symbol.for('ModelHasManyAssociations');
export const HasManyMetadataSym = Symbol.for('HasManyMetadata');
