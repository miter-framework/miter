import { PropMetadata } from '../../metadata';
import { Prop } from './prop.decorator';
import * as Types from './types';
import * as _ from 'lodash';

export function Counter(columnName?: PropMetadata | string) {
    let meta: PropMetadata;
    if (typeof columnName === 'string') meta = { columnName: columnName };
    else meta = columnName || {};
    
    return Prop(_.merge<PropMetadata>({
        type: Types.INTEGER,
        defaultValue: 0,
        allowNull: false
    }, meta));
}
