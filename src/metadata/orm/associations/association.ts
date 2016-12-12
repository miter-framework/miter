import { StaticModelT, ModelT } from '../../../core';

export interface AssociationMetadata {
    foreignModel?: StaticModelT<ModelT<any>>;
    foreignTableName?: string;
    foreignModelName?: string;
};
