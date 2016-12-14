import * as _ from 'lodash';
import { Service } from '../decorators';
import { ModelMetadata, PropMetadata, AssociationMetadata } from '../metadata';

@Service()
export class OrmTransformService {
    constructor() { }
    
    public transformModel(modelMeta: ModelMetadata): ModelMetadata | null {
        // modelMeta = _.cloneDeep(modelMeta);
        (<any>modelMeta).charset = 'utf8';
        (<any>modelMeta).collate = 'utf8_general_ci';
        return modelMeta;
    }
    public transformModelName(className: string): string | null {
        return null;
    }
    
    public transformColumn(propMeta: PropMetadata): PropMetadata | null {
        return propMeta;
    }
    public transformColumnName(fieldName: string): string | null {
        return null;
    }
    
    public transformAssociation(assocMeta: AssociationMetadata): AssociationMetadata | null {
        return assocMeta;
    }
    public transformAssociationColumnName(fieldName: string): string | null {
        return fieldName + 'Id';
    }
}
