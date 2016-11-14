import { Prop } from '../prop.decorator';
import { ModelBelongsToAssociationsSym, BelongsToMetadata, BelongsToMetadataSym } from '../../../metadata';

export function BelongsTo(propMeta?: BelongsToMetadata) {
   let meta = propMeta || {};
   
   return function(model: any, propertyName: string) {
      var props: string[] = Reflect.getOwnMetadata(ModelBelongsToAssociationsSym, model) || [];
      props.push(propertyName);
      Reflect.defineMetadata(ModelBelongsToAssociationsSym, props, model);
      
      Reflect.defineMetadata(BelongsToMetadataSym, meta, model, propertyName);
   }
}
