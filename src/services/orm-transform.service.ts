import { Service } from '../decorators';
import { ModelMetadata, PropMetadata } from '../metadata';

@Service()
export class OrmTransformService {
   constructor() { }
   
   public transformModelName(className: string, modelMeta: ModelMetadata): string | null {
      return null;
   }
   public transformColumnName(fieldName: string, propMeta: PropMetadata): string | null {
      return null;
   }
}
