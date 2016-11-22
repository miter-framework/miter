import { StaticModelT, ModelT } from '../../../core';
import { HasManyMetadata, ModelHasManyAssociationsSym, HasManyMetadataSym } from '../../../metadata';

function isHasManyMetadata(test: any): test is HasManyMetadata {
    return !!(<any>test).foreignModel;
}

export function HasMany(propMeta: HasManyMetadata | StaticModelT<ModelT<any>>) {
    let meta: HasManyMetadata;
    if (isHasManyMetadata(propMeta)) meta = propMeta;
    else meta = { foreignModel: propMeta };

    return function(model: any, propertyName: string) {
        var props: string[] = Reflect.getOwnMetadata(ModelHasManyAssociationsSym, model) || [];
        props.push(propertyName);
        Reflect.defineMetadata(ModelHasManyAssociationsSym, props, model);
        
        Reflect.defineMetadata(HasManyMetadataSym, meta, model, propertyName);
    }
}
