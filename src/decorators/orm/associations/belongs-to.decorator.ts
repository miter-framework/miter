import { StaticModelT, ModelT } from '../../../core/model';
import { ForeignModelSource } from '../../../metadata/orm/associations/association';
import { ModelBelongsToAssociationsSym, BelongsToMetadata, BelongsToMetadataSym } from '../../../metadata/orm/associations/belongs-to';

function isStaticModelT(test: any): test is StaticModelT<ModelT<any>> {
  return test && !!(<any>test).db;
}
function isForeignModelSource(test: any): test is ForeignModelSource {
  return test && (isStaticModelT(test) || !!(<any>test).modelName || !!(<any>test).tableName || typeof test === 'function');
}

export function BelongsTo(propMeta?: BelongsToMetadata | ForeignModelSource) {
  let meta: BelongsToMetadata = {};
  if (isForeignModelSource(propMeta)) meta = { foreignModel: propMeta };
  else if (propMeta) meta = propMeta;

  return function(model: any, propertyName: string) {
    if (!isForeignModelSource(meta.foreignModel)) {
      meta.foreignModel = Reflect.getMetadata('design:type', model, propertyName);
      if (<any>meta.foreignModel === Object) meta.foreignModel = undefined;
      else if (!isStaticModelT(meta.foreignModel)) throw new Error(`Cannot infer relation type for belongs-to association ${model.name || model}.${propertyName}.`);
    }

    meta.as = propertyName;

    let props: string[] = Reflect.getOwnMetadata(ModelBelongsToAssociationsSym, model) || [];
    props.push(propertyName);
    Reflect.defineMetadata(ModelBelongsToAssociationsSym, props, model);

    Reflect.defineMetadata(BelongsToMetadataSym, meta, model, propertyName);
  }
}
