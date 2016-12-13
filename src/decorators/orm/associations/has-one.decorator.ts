import { StaticModelT, ModelT } from '../../../core';
import { ModelHasOneAssociationsSym, HasOneMetadata, HasOneMetadataSym, ForeignModelSource } from '../../../metadata';

function isStaticModelT(test: any): test is StaticModelT<ModelT<any>> {
    return test && !!(<any>test).db;
}
function isForeignModelSource(test: any): test is ForeignModelSource {
    return test && (isStaticModelT(test) || !!(<any>test).modelName || !!(<any>test).tableName || typeof test === 'function');
}

export function HasOne(propMeta?: HasOneMetadata | StaticModelT<ModelT<any>> | string) {
    let meta: HasOneMetadata = {};
    if (isForeignModelSource(propMeta)) meta = { foreignModel: propMeta };
    else if (propMeta) meta = propMeta;
    
    return function(model: any, propertyName: string) {
        if (!isForeignModelSource(meta.foreignModel)) {
            meta.foreignModel = Reflect.getMetadata('design:type', model, propertyName);
            if (<any>meta.foreignModel === Object) meta.foreignModel = undefined;
            else if (!isStaticModelT(meta.foreignModel)) throw new Error(`Cannot infer relation type for has-one association ${model.name || model}.${propertyName}.`);
        }
        
        meta.as = propertyName;
        
        var props: string[] = Reflect.getOwnMetadata(ModelHasOneAssociationsSym, model) || [];
        props.push(propertyName);
        Reflect.defineMetadata(ModelHasOneAssociationsSym, props, model);
        
        Reflect.defineMetadata(HasOneMetadataSym, meta, model, propertyName);
    }
}
