import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym } from '../../orm/metadata';
import "reflect-metadata";

function furnishDefaults(meta: ModelMetadata, model: any) {
   if (!meta.tableName) meta.tableName = model.name;
}

export function Model(tableName?: ModelMetadata | string) {
   var meta: ModelMetadata;
   if (typeof tableName === 'string') meta = { tableName: <string>tableName };
   else meta = tableName;
   
   return function(model: any) {
      furnishDefaults(meta, model);
      Reflect.defineMetadata(ModelMetadataSym, meta, model.prototype);
      
      var props = Reflect.getOwnMetadata(ModelPropertiesSym, model.prototype) || [];
      Reflect.defineMetadata(ModelPropertiesSym, props, model.prototype);
   }
}
