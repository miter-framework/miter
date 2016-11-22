import { Service } from '../decorators';
import { ModelMetadata, PropMetadata } from '../metadata';

@Service()
export class OrmTransformService {
    constructor() { }
    
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
}
