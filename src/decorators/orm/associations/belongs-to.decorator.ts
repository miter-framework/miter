import { StaticModelT, ModelT } from '../../../core';
import { ModelBelongsToAssociationsSym, BelongsToMetadata, BelongsToMetadataSym } from '../../../metadata';

function isStaticModelT(test: any): test is StaticModelT<ModelT<any>> {
    return test && !!(<any>test).db;
}

export function BelongsTo(propMeta?: BelongsToMetadata | StaticModelT<ModelT<any>> | string) {
    let meta: BelongsToMetadata = {};
    if (isStaticModelT(propMeta)) meta = { foreignModel: propMeta };
    else if (typeof propMeta === 'string') meta = { foreignModelName: propMeta };
    else if (propMeta) meta = propMeta;
    
    return function(model: any, propertyName: string) {
        if (!meta.foreignModel && !meta.foreignTableName && !meta.foreignModelName) {
            meta.foreignModel = Reflect.getMetadata('design:type', model, propertyName);
            if (<any>meta.foreignModel === Object) meta.foreignModel = undefined;
            else if (!isStaticModelT(meta.foreignModel)) throw new Error(`Cannot infer relation type for ${model.name || model}.${propertyName}.`);
        }
        
        var props: string[] = Reflect.getOwnMetadata(ModelBelongsToAssociationsSym, model) || [];
        props.push(propertyName);
        Reflect.defineMetadata(ModelBelongsToAssociationsSym, props, model);
        
        Reflect.defineMetadata(BelongsToMetadataSym, meta, model, propertyName);
    }
}
