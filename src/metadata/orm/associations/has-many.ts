import { CtorT, ModelT } from '../../../core';

export type HasManyMetadata = {
   foreignModel: CtorT<ModelT<any>>,
   
   foreignKey?: string
};

export const ModelHasManyAssociationsSym = Symbol.for('ModelHasManyAssociations');
export const HasManyMetadataSym = Symbol.for('HasManyMetadata');
