import 'reflect-metadata';
import _ = require('lodash');
// import { Model as SqlModel } from 'sequelize';

import { StaticModelT, ModelT, PkType } from '../core/model';
import { TransactionT } from '../core/transaction';

import { Injectable } from '../decorators/services/injectable.decorator';
import { Name } from '../decorators/services/name.decorator';

import { OrmMetadata } from '../metadata/server/orm';
import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym } from '../metadata/orm/model';
import { PropMetadata, PropMetadataSym } from '../metadata/orm/prop';
import { AssociationMetadata } from '../metadata/orm/associations/association';
import { ModelHasManyAssociationsSym, HasManyMetadataSym, HasManyMetadata } from '../metadata/orm/associations/has-many';
import { ModelBelongsToAssociationsSym, BelongsToMetadataSym, BelongsToMetadata } from '../metadata/orm/associations/belongs-to';
import { ModelHasOneAssociationsSym, HasOneMetadataSym, HasOneMetadata } from '../metadata/orm/associations/has-one';

import { LoggerCore } from '../services/logger-core';
import { Logger } from '../services/logger';
// import { Sequelize } from './sequelize';
import { OrmTransformService } from '../services/orm-transform.service';
import { TransactionService } from '../services/transaction.service';

// import { DbImpl } from './impl/db-impl';

type AssociationTypeDef = {
    sqlName: string,
    msgName: string,
    associationsSym: Symbol,
    metadataSym: Symbol,
    transform?: (propMeta: AssociationMetadata, propName: string) => void
};

@Injectable()
@Name('orm')
export class OrmReflector {
    constructor(
        private logger: Logger,
        private loggerCore: LoggerCore,
        private ormMeta: OrmMetadata,
        private transactionService: TransactionService,
        private ormTransform: OrmTransformService
    ) {
    }
    
    async init() {
        // this.logger.verbose(`Initializing ORM...`);
        // await this.sql.init();
        
        // let models = this.ormMeta.models;
        // this.reflectModels(models);
        // this.reflectAssociations(models);
        // this.createDbImpls(models);
        
        // await this.sql.sync();
        // this.logger.info(`Finished initializing ORM.`);
    }
    
    reflectModels(models: StaticModelT<ModelT<PkType>>[]) {
        for (let q = 0; q < models.length; q++) {
            this.reflectModel(models[q]);
        }
    }
    
    private models = new Map<StaticModelT<ModelT<PkType>>, SqlModel<{}, {}>>();
    private modelsByTableName = new Map<string, StaticModelT<ModelT<PkType>>>();
    reflectModel(modelFn: StaticModelT<ModelT<PkType>>) {
        if (this.models.has(modelFn)) throw new Error(`A model was passed to the orm-reflector twice: ${modelFn.name || modelFn}.`);
        let modelProto = modelFn.prototype;
        
        let meta: ModelMetadata = Reflect.getOwnMetadata(ModelMetadataSym, modelProto);
        if (!meta) throw new Error(`Expecting class with @Model decorator, could not reflect model properties for ${modelProto}.`);
        // let modelOptions = _.cloneDeep(meta);
        let modelOptions = meta;
        modelOptions = this.ormTransform.transformModel(modelOptions) || modelOptions;
        
        modelOptions.tableName = modelOptions.tableName || this.ormTransform.transformModelName(modelFn.name) || modelFn.name;
        let dupTable = this.modelsByTableName.get(modelOptions.tableName);
        if (dupTable) throw new Error(`Defining multiple models with the same table name! ${dupTable.name || dupTable} and ${modelFn.name || modelFn}`);
        this.modelsByTableName.set(modelOptions.tableName, modelFn);
        
        let columns = {};
        let props: string[] = Reflect.getOwnMetadata(ModelPropertiesSym, modelProto) || [];
        for (let q = 0; q < props.length; q++) {
            let propName: string = props[q];
            let propMeta: PropMetadata = Reflect.getOwnMetadata(PropMetadataSym, modelProto, propName);
            if (!propMeta) throw new Error(`Could not find model property metadata for property ${modelFn.name || modelFn}.${propName}.`);
            
            // let columnMeta = <any>_.cloneDeep(propMeta);
            let columnMeta = propMeta;
            columnMeta = this.ormTransform.transformColumn(columnMeta) || columnMeta;
            
            (columnMeta as any).field = columnMeta.columnName || this.ormTransform.transformColumnName(propName) || propName;
            // delete columnMeta.columnName;
            
            (<any>columns)[propName] = columnMeta;
        }
        
        let model = this.sql.define(modelOptions.tableName, columns, modelOptions);
        this.models.set(modelFn, <any>model);
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
        
        let associationTypes: AssociationTypeDef[] = [
            {
                sqlName: 'hasMany',
                msgName: 'has-many',
                associationsSym: ModelHasManyAssociationsSym,
                metadataSym: HasManyMetadataSym,
                transform: (propMeta: HasManyMetadata, propName: string) => {
                    
                }
            },
            {
                sqlName: 'belongsTo',
                msgName: 'belongs-to',
                associationsSym: ModelBelongsToAssociationsSym,
                metadataSym: BelongsToMetadataSym,
                transform: (propMeta: BelongsToMetadata, propName: string) => {
                    propMeta.foreignKey = propMeta.foreignKey || this.ormTransform.transformAssociationColumnName(propName) || propName;
                }
            },
            {
                sqlName: 'hasOne',
                msgName: 'has-one',
                associationsSym: ModelHasOneAssociationsSym,
                metadataSym: HasOneMetadataSym,
                transform: (propMeta: HasOneMetadata, propName: string) => {
                    
                }
            }
        ];
        
        for (let q = 0; q < associationTypes.length; q++) {
            let def = associationTypes[q];
            let associationNames = Reflect.getOwnMetadata(def.associationsSym, modelProto) || [];
            for (let w = 0; w < associationNames.length; w++) {
                let propName = associationNames[w];
                let propMeta: AssociationMetadata = Reflect.getOwnMetadata(def.metadataSym, modelProto, propName);
                if (!propMeta) throw new Error(`Could not find model ${def.msgName} metadata for property ${modelFn.name || modelFn}.${propName}`);
                
                let foreignModelFn = this.resolveForeignModelFn(propMeta);
                if (!foreignModelFn) throw new Error(`Could not resolve foreign model for ${def.msgName} association ${modelFn.name || modelFn}.${propName}`);
                let foreignModel = this.models.get(foreignModelFn);
                if (!foreignModel) throw new Error(`Could not create ${def.msgName} association ${modelFn.name || modelFn}.${propName} to model that has not been reflected: ${foreignModelFn.name || foreignModelFn}`);
                
                // let sqlMeta = _.cloneDeep(propMeta);
                let sqlMeta = propMeta;
                sqlMeta = this.ormTransform.transformAssociation(sqlMeta) || sqlMeta;
                if (def.transform) def.transform(sqlMeta, propName);
                
                (<any>model)[def.sqlName](foreignModel, propMeta);
            }
        }
    }
    
    private createDbImpls(models: StaticModelT<ModelT<any>>[]) {
        for (let q = 0; q < models.length; q++) {
            let modelFn = models[q];
            let model = this.models.get(modelFn);
            if (!model) throw new Error(`Could not reflect model associations for a model that failed to be reflected: ${modelFn.name || modelFn}.`);
            let db = new DbImpl(modelFn, model, this.sql, this.dbImplLogger, this.transactionService);
            modelFn.db = db;
        }
    }
    
    private isStaticModelT(test: any): test is StaticModelT<ModelT<any>> {
        return test && !!(<any>test).db;
    }
    private isTableNameRef(test: any): test is { tableName: string } {
        return test.tableName;
    }
    private isModelNameRef(test: any): test is { modelName: string } {
        return test.modelName;
    }
    private resolveForeignModelFn(meta: AssociationMetadata): StaticModelT<ModelT<any>> | undefined {
        let fmod = meta.foreignModel;
        if (!fmod) return undefined;
        if (this.isStaticModelT(fmod)) return fmod;
        if (typeof fmod === 'function') return meta.foreignModel = fmod();
        else if (this.isTableNameRef(fmod)) return meta.foreignModel = this.modelsByTableName.get(fmod.tableName);
        else if (this.isModelNameRef(fmod)) {
            let modelName = fmod.modelName;
            return meta.foreignModel = [...this.models.keys()].find(model => model.name == modelName);
        }
    }
}
