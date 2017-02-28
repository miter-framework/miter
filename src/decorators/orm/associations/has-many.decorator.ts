import { StaticModelT, ModelT } from '../../../core/model';
import { ForeignModelSource } from '../../../metadata/orm/associations/association';
import { HasManyMetadata, ModelHasManyAssociationsSym, HasManyMetadataSym } from '../../../metadata/orm/associations/has-many';

function isStaticModelT(test: any): test is StaticModelT<ModelT<any>> {
    return test && !!(<any>test).db;
}
function isForeignModelSource(test: any): test is ForeignModelSource {
    return test && (isStaticModelT(test) || !!(<any>test).modelName || !!(<any>test).tableName || typeof test === 'function');
}

export function HasMany(propMeta: HasManyMetadata | ForeignModelSource) {
    let meta: HasManyMetadata = {};
    if (isForeignModelSource(propMeta)) meta = { foreignModel: propMeta };
    else meta = propMeta;
    
    return function(model: any, propertyName: string) {
        if (!isForeignModelSource(meta.foreignModel)) {
            throw new Error(`Cannot infer relation type for has-many association in ${model.name || model}.${propertyName}.`);
        }
        
        meta.as = propertyName;
        
        let props: string[] = Reflect.getOwnMetadata(ModelHasManyAssociationsSym, model) || [];
        props.push(propertyName);
        Reflect.defineMetadata(ModelHasManyAssociationsSym, props, model);
        
        Reflect.defineMetadata(HasManyMetadataSym, meta, model, propertyName);
    }
}
