import { StaticModelT, ModelT, PkType } from '../../core/model';
import { ModelMetadata, ModelMetadataSym, ModelPropertiesSym } from '../../metadata/orm/model';
import 'reflect-metadata';
import { Pk } from './pk.decorator';
import _ = require('lodash');

export interface SanitizeFn<T> {
  (this: T, json: any): any
}

export function Sanitize<T extends ModelT<PkType>>(fn: SanitizeFn<T>) {
  return function(model: StaticModelT<T>) {
    let proto = model.prototype;
    if (proto.hasOwnProperty('toJSON')) {
      console.warn(`Failed to apply Sanitize directive to ${model.name || model}. This class already has a toJSON property.`);
      return;
    }

    proto.toJSON = function(this: T) {
      let clone = _.cloneDeep(this);
      clone = Object.assign({}, clone);
      fn.call(this, clone);
      return clone;
    };
  }
}
