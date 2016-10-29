import { CtorT, ModelT } from '../core';
import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym } from '../core/metadata';
import 'reflect-metadata';

function furnishDefaults(meta: ModelMetadata, model: any) {
   if (!meta.tableName) meta.tableName = model.name;
}

export function Model(tableName?: ModelMetadata | string) {
   var meta: ModelMetadata;
   if (typeof tableName === 'string') meta = { tableName: <string>tableName };
   else if (typeof tableName !== 'undefined') meta = tableName;
   
   return function(model: CtorT<ModelT>) {
      furnishDefaults(meta, model);
      Reflect.defineMetadata(ModelMetadataSym, meta, model.prototype);
      
      var props = Reflect.getOwnMetadata(ModelPropertiesSym, model.prototype) || [];
      Reflect.defineMetadata(ModelPropertiesSym, props, model.prototype);
   }
}
