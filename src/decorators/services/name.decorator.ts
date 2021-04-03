import { CtorT } from '../../core/ctor';
import { Meta } from './meta.decorator';

export function Name(value: string) {
  return Meta('name', value);
}
