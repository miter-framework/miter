import { PropMetadata } from '../../metadata/orm/prop';
import { Prop } from './prop.decorator';
import { Types } from '../../metadata/orm/types';
import * as _ from 'lodash';

export function Flag(columnName?: PropMetadata | string) {
    let meta: PropMetadata;
    if (typeof columnName === 'string') meta = { columnName: columnName };
    else meta = columnName || {};
    
    return Prop(_.merge<PropMetadata>({
        type: Types.boolean,
        defaultValue: false,
        allowNull: false
    }, meta));
}
