import 'reflect-metadata';
import _ = require('lodash');
import config = require('config');
import * as Sequelize from 'sequelize';

import { Injector, StaticModelT, ModelT, PkType } from '../core';
import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym, PropMetadata, PropMetadataSym } from '../core/metadata';
import { Server } from '../server';
import { DbImpl } from './db-impl';

export class OrmReflector {
   constructor(private server: Server) {
   }
   
   private sql: Sequelize.Sequelize;
   
   async init() {
      var name = config.get<string>('connections.db.name');
      var port = config.get<number>('connections.db.port');
      var user = config.get<string>('connections.db.user');
      var password = config.get<string>('connections.db.password');
      var host = config.get<string>('connections.db.host');
      var dialect = config.has('connections.db.dialect') ? config.get<string>('connections.db.dialect') : 'mysql';
      
      this.sql = new Sequelize(name, user, password, {
         host: host,
         dialect: dialect
      });
      
      this.reflectModels(this.server.meta.models || []);
      await this.sync();
   }
   
   async sync() {
      await this.sql.sync();
   }
   
   reflectModels(models: StaticModelT<ModelT<PkType>>[]) {
      for (var q = 0; q < models.length; q++) {
         this.reflectModel(models[q]);
      }
   }
   
   private models = new Map<StaticModelT<ModelT<PkType>>, Sequelize.Model<{}, {}>>();
   reflectModel(modelFn: StaticModelT<ModelT<PkType>>) {
      if (this.models.has(modelFn)) throw new Error(`A model was passed to the orm-reflector twice: ${modelFn}.`);
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
      
      let model = this.sql.define(tableName, columns, modelOptions);
      let db = new DbImpl(modelFn, model);
      this.models.set(modelFn, model);
      modelFn.db = db;
   }
}
