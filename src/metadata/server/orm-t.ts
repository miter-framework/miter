import { StaticModelT, ModelT, PkType } from '../../core/model';
import { DatabaseMetadataT } from './database-t';

export interface OrmMetadataT {
  enabled?: boolean,
  db?: DatabaseMetadataT,
  recreate?: boolean,
  models?: StaticModelT<ModelT<PkType>>[]
};
