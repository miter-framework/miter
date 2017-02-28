import { StaticModelT, ModelT } from '../../../core/model';

export type ForeignModelSource = StaticModelT<ModelT<any>>
                               | { (): StaticModelT<ModelT<any>> }
                               | { modelName: string }
                               | { tableName: string };

export interface AssociationMetadata {
    foreignModel?: ForeignModelSource;
};
