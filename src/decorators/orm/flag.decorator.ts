import { PropMetadata } from '../../metadata/orm/prop';
import { Prop } from './prop.decorator';
import * as Types from './types';
import * as _ from 'lodash';

export function Flag(columnName?: PropMetadata | string) {
    let meta: PropMetadata;
    if (typeof columnName === 'string') meta = { columnName: columnName };
    else meta = columnName || {};
    
    return Prop(_.merge<PropMetadata>({
        type: Types.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }, meta));
}
