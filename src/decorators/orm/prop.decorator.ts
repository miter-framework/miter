import { PropMetadata, PropMetadataSym, ModelPropertiesSym } from '../../metadata';
import * as sequelize from 'sequelize';
import 'reflect-metadata';

export function Prop(columnName: PropMetadata | string | undefined) {
   let meta: PropMetadata;
   if (typeof columnName === 'string') meta = { columnName: columnName };
   else meta = columnName || {};
   
   return function(model: any, propertyName: string) {
      var props: string[] = Reflect.getOwnMetadata(ModelPropertiesSym, model) || [];
      props.push(propertyName);
      Reflect.defineMetadata(ModelPropertiesSym, props, model);
      
      if (!meta.type) {
         var reflectType = Reflect.getMetadata('design:type', model, propertyName);
         var sequelizeType: any = null;
         if (reflectType === String) sequelizeType = sequelize.STRING;
         else if (reflectType === Number) {
            if (meta.primaryKey || meta.autoIncrement) sequelizeType = sequelize.INTEGER;
            else sequelizeType = sequelize.FLOAT;
         }
         else if (reflectType === Date) sequelizeType = sequelize.DATE;
         else if (reflectType === Boolean) sequelizeType = sequelize.BOOLEAN;
         else throw new Error(`Could not infer column type for model property: ${propertyName}`);
         meta.type = sequelizeType;
      }
      Reflect.defineMetadata(PropMetadataSym, meta, model, propertyName);
   }
}
