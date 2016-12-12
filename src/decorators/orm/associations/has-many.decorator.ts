import { StaticModelT, ModelT } from '../../../core';
import { HasManyMetadata, ModelHasManyAssociationsSym, HasManyMetadataSym } from '../../../metadata';

function isStaticModelT(test: any): test is StaticModelT<ModelT<any>> {
    return test && !!(<any>test).db;
}

export function HasMany(propMeta: HasManyMetadata | StaticModelT<ModelT<any>> | string) {
    let meta: HasManyMetadata = {};
    if (isStaticModelT(propMeta)) meta = { foreignModel: propMeta };
    else if (typeof propMeta === 'string') meta = { foreignModelName: propMeta };
    else if (propMeta) meta = propMeta;
    
    return function(model: any, propertyName: string) {
        var props: string[] = Reflect.getOwnMetadata(ModelHasManyAssociationsSym, model) || [];
        props.push(propertyName);
        Reflect.defineMetadata(ModelHasManyAssociationsSym, props, model);
        
        Reflect.defineMetadata(HasManyMetadataSym, meta, model, propertyName);
    }
}
