import { StaticModelT, ModelT, PkType } from '../../core';
import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym } from '../../core/metadata';
import 'reflect-metadata';
import { Pk } from './pk.decorator';

function furnishDefaults(meta: ModelMetadata, model: any) {
   if (!meta.tableName) meta.tableName = model.name;
}

export function Model(tableName?: ModelMetadata | string) {
   var meta: ModelMetadata;
   if (typeof tableName === 'string') meta = { tableName: <string>tableName };
   else if (typeof tableName !== 'undefined') meta = tableName;
   
   return function(model: StaticModelT<ModelT<PkType>>) {
      furnishDefaults(meta, model);
      Reflect.defineMetadata(ModelMetadataSym, meta, model.prototype);
      
      let props = Reflect.getOwnMetadata(ModelPropertiesSym, model.prototype) || [];
      if (!props.find(propName => propName == 'id')) {
         Pk()(model.prototype, 'id');
         props = Reflect.getOwnMetadata(ModelPropertiesSym, model.prototype);
      }
      Reflect.defineMetadata(ModelPropertiesSym, props, model.prototype);
   }
}
