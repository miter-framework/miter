import 'reflect-metadata';
import { Sequelize } from 'sequelize';
import { AppModels } from '../models';
import _ = require('lodash');

import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym, PropMetadata, PropMetadataSym } from './metadata';

export class OrmReflector {
   constructor(private orm: Sequelize) {
      this.reflectModels(AppModels);
   }
   
   async sync() {
      await this.orm.sync();
   }
   
   reflectModels(models: any[]) {
      for (var q = 0; q < models.length; q++) {
         this.reflectModel(models[q]);
      }
   }
   
   private models: any = {};
   reflectModel(modelFn: any) {
      if (this.models[modelFn]) throw new Error(`A model was passed to the orm-reflector twice: ${modelFn}.`);
      var modelProto = modelFn.prototype;
      
      var meta: ModelMetadata = Reflect.getOwnMetadata(ModelMetadataSym, modelProto);
      if (!meta) throw new Error(`Expecting class with @Model decorator, could not reflect model properties for ${modelProto}.`);
      
      var tableName = meta.tableName;
      var columns = {};
      var modelOptions = _.cloneDeep(meta);
      
      var props: string[] = Reflect.getOwnMetadata(ModelPropertiesSym, modelProto) || [];
      for (var q = 0; q < props.length; q++) {
         var propName: string = props[q];
         var propMeta: PropMetadata = Reflect.getOwnMetadata(PropMetadataSym, modelProto, propName);
         if (!propMeta) throw new Error(`Could not find model property metadata for property ${modelFn}.${propName}.`);
         
         var columnMeta = <any>_.cloneDeep(propMeta);
         if (propMeta.columnName) {
            delete columnMeta.columnName;
            columnMeta.field = propMeta.columnName;
         }
         
         columns[propName] = columnMeta;
      }
      
      this.models[modelFn] = this.orm.define(tableName, columns, modelOptions);
   }
}
