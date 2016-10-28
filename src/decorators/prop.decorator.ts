import { PropMetadata, PropMetadataSym, ModelPropertiesSym } from '../orm';
import * as sequelize from 'sequelize';
import 'reflect-metadata';

export function Prop(meta: PropMetadata = {}) {
   return function(model: any, propertyName: string) {
      var props: string[] = Reflect.getOwnMetadata(ModelPropertiesSym, model) || [];
      props.push(propertyName);
      Reflect.defineMetadata(ModelPropertiesSym, props, model);
      
      if (!meta.type) {
         var reflectType = Reflect.getMetadata('design:type', model, propertyName);
         var sequelizeType: any = null;
         if (reflectType === String) sequelizeType = sequelize.STRING;
         else if (reflectType === Number) sequelizeType = sequelize.FLOAT;
         else if (reflectType === Date) sequelizeType = sequelize.DATE;
         else if (reflectType === Boolean) sequelizeType = sequelize.BOOLEAN;
         else throw new Error(`Could not infer column type for model property: ${propertyName}`);
         meta.type = sequelizeType;
      }
      Reflect.defineMetadata(PropMetadataSym, meta, model, propertyName);
   }
}
