import { Service } from '../decorators/services/service.decorator';
import { ModelMetadata } from '../metadata/orm/model';
import { OrmTransformService } from './orm-transform.service';
import { pluralize } from '../util/pluralize';

@Service()
export class SnakeCaseOrmTransformService extends OrmTransformService {
    constructor() {
        super();
    }
    
    public transformModel(modelMeta: ModelMetadata): ModelMetadata | null {
        modelMeta.underscored = true;
        return modelMeta;
    }
    public transformModelName(className: string): string | null {
        let parts = [...this.splitOnWords(className)].filter(Boolean);
        if (!parts.length) return null;
        parts[parts.length - 1] = pluralize(parts[parts.length - 1]);
        return parts.map(pt => pt.toLowerCase()).join('_');
    }
    public transformColumnName(fieldName: string): string | null {
        let parts = [...this.splitOnWords(fieldName)].filter(Boolean);
        if (!parts.length) return null;
        return parts.map(pt => pt.toLowerCase()).join('_');
    }
    public transformAssociationColumnName(fieldName: string): string | null {
        return this.transformColumnName(super.transformAssociationColumnName(fieldName) || fieldName);
    }
    
    private *splitOnWords(name: string) {
        if (!name) return;
        let currentWord = '';
        for (let q = 0; q < name.length; q++) {
            let chr = name[q];
            if (chr.match(/[A-Z]/)) {
                if (currentWord) yield currentWord;
                currentWord = chr;
            }
            else if (chr == '_') {
                if (currentWord) yield currentWord;
                currentWord = '';
            }
            else currentWord += chr;
        }
        if (currentWord) yield currentWord;
    }
}
