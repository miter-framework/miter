import { Prop } from '../prop.decorator';
import { ModelHasOneAssociationsSym, HasOneMetadata, HasOneMetadataSym } from '../../../metadata';

export function HasOne(propMeta?: HasOneMetadata) {
    let meta = propMeta || {};
    
    return function(model: any, propertyName: string) {
        var props: string[] = Reflect.getOwnMetadata(ModelHasOneAssociationsSym, model) || [];
        props.push(propertyName);
        Reflect.defineMetadata(ModelHasOneAssociationsSym, props, model);
        
        Reflect.defineMetadata(HasOneMetadataSym, meta, model, propertyName);
    }
}
