import { Service } from '../decorators/services/service.decorator';
import { ModelMetadata } from '../metadata/orm/model';
import { PropMetadata } from '../metadata/orm/prop';
import { AssociationMetadata } from '../metadata/orm/associations/association';

@Service()
export class OrmTransformService {
    constructor() { }
    
    async start() { }
    
    public transformModel(modelMeta: ModelMetadata): ModelMetadata | null {
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
        if (!fieldName) return null;
        return fieldName + 'Id';
    }
}
