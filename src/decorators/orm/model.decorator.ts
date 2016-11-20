import { StaticModelT, ModelT, PkType } from '../../core';
import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym } from '../../metadata';
import 'reflect-metadata';
import { Pk } from './pk.decorator';

export function Model(tableName: ModelMetadata | string | undefined) {
   var meta: ModelMetadata;
   if (typeof tableName === 'string') meta = { tableName: tableName };
   else meta = tableName || {};
   
   return function(model: StaticModelT<ModelT<PkType>>) {
      Reflect.defineMetadata(ModelMetadataSym, meta, model.prototype);
      
      let props = Reflect.getOwnMetadata(ModelPropertiesSym, model.prototype) || [];
      if (!props.find(propName => propName == 'id')) {
         Pk()(model.prototype, 'id');
         props = Reflect.getOwnMetadata(ModelPropertiesSym, model.prototype);
      }
      Reflect.defineMetadata(ModelPropertiesSym, props, model.prototype);
   }
}
