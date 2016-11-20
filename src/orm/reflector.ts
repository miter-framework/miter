import 'reflect-metadata';
import _ = require('lodash');
import * as Sequelize from 'sequelize';

import { Injector, StaticModelT, ModelT, PkType } from '../core';
import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym, PropMetadata, PropMetadataSym,
         ModelHasManyAssociationsSym, HasManyMetadata, HasManyMetadataSym } from '../metadata';
import { Server } from '../server';
import { OrmTransformService } from '../services';
import { DbImpl } from './db-impl';

export class OrmReflector {
   constructor(private server: Server) {
      let ormTransform = server.injector.resolveInjectable(OrmTransformService);
      if (!ormTransform) throw new Error(`Failed to resolve OrmTransformService. Can't reflect ORM models`);
      this.ormTransform = ormTransform;
   }
   
   private ormTransform: OrmTransformService;
   
   private sql: Sequelize.Sequelize;
   
   async init() {
      let orm = this.server.meta.orm;
      if (!orm || (typeof orm.enabled !== 'undefined' && !orm.enabled) || !orm.db) return;
      let db = orm.db;
      
      let host = db.host;
      let port: number | undefined = undefined;
      if (typeof host !== 'string') {
         port = host.port;
         host = host.domain;
      }
      
      this.sql = new Sequelize(db.name, db.user, db.password, {
         host: host,
         dialect: db.dialect || 'mysql',
         port: port
      });
      
      this.reflectModels(this.server.meta.models || []);
      this.reflectAssociations(this.server.meta.models || []);
      await this.sync();
   }
   
   async sync() {
      await this.sql.sync();
   }
   
   reflectModels(models: StaticModelT<ModelT<PkType>>[]) {
      for (let q = 0; q < models.length; q++) {
         this.reflectModel(models[q]);
      }
   }
   
   private models = new Map<StaticModelT<ModelT<PkType>>, Sequelize.Model<{}, {}>>();
   reflectModel(modelFn: StaticModelT<ModelT<PkType>>) {
      if (this.models.has(modelFn)) throw new Error(`A model was passed to the orm-reflector twice: ${modelFn.name || modelFn}.`);
      let modelProto = modelFn.prototype;
      
      let meta: ModelMetadata = Reflect.getOwnMetadata(ModelMetadataSym, modelProto);
      if (!meta) throw new Error(`Expecting class with @Model decorator, could not reflect model properties for ${modelProto}.`);
      meta = this.ormTransform.transformModel(meta) || meta;
      
      let tableName = meta.tableName || this.ormTransform.transformModelName(modelFn.name) || modelFn.name;
      let columns = {};
      let modelOptions = _.cloneDeep(meta);
      
      let props: string[] = Reflect.getOwnMetadata(ModelPropertiesSym, modelProto) || [];
      for (let q = 0; q < props.length; q++) {
         let propName: string = props[q];
         let propMeta: PropMetadata = Reflect.getOwnMetadata(PropMetadataSym, modelProto, propName);
         if (!propMeta) throw new Error(`Could not find model property metadata for property ${modelFn.name || modelFn}.${propName}.`);
         propMeta = this.ormTransform.transformColumn(propMeta) || propMeta;
         
         let columnMeta = <any>_.cloneDeep(propMeta);
         columnMeta.field = columnMeta.columnName || this.ormTransform.transformColumnName(propName) || propName;
         delete columnMeta.columnName;
         
         columns[propName] = columnMeta;
      }
      
      let model = this.sql.define(tableName, columns, modelOptions);
      this.models.set(modelFn, model);
   }
   
   private reflectAssociations(models: StaticModelT<ModelT<PkType>>[]) {
      for (let q = 0; q < models.length; q++) {
         this.reflectModelAssociations(models[q]);
      }
   }
   
   private reflectModelAssociations(modelFn: StaticModelT<ModelT<PkType>>) {
      let model = this.models.get(modelFn);
      if (!model) throw new Error(`Could not reflect model associations for a model that failed to be reflected: ${modelFn.name || modelFn}.`);
      let modelProto = modelFn.prototype;
      
      let meta: ModelMetadata = Reflect.getOwnMetadata(ModelMetadataSym, modelProto);
      if (!meta) throw new Error(`Expecting class with @Model decorator, could not reflect model properties for ${modelProto}.`);
      
      let hasMany: string[] = Reflect.getOwnMetadata(ModelHasManyAssociationsSym, modelProto) || [];
      for (let q = 0; q < hasMany.length; q++) {
         let propName: string = hasMany[q];
         let hasManyMeta: HasManyMetadata = Reflect.getOwnMetadata(HasManyMetadataSym, modelProto, propName);
         if (!hasManyMeta) throw new Error(`Could not find model has-many metadata for property ${modelFn.name || modelFn}.${propName}.`);
         
         let foreignModelFn = hasManyMeta.foreignModel;
         let foreignModel = this.models.get(foreignModelFn);
         if (!foreignModel) throw new Error(`Could not create has-many association ${modelFn.name || modelFn}.${propName} to model that has not been reflected: ${foreignModelFn.name || foreignModelFn}`);
         
         model.hasMany(foreignModel, hasManyMeta);
      }
      
      let db = new DbImpl(modelFn, model);
      modelFn.db = db;
   }
}
