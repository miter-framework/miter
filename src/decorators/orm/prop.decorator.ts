import { PropMetadata, PropMetadataSym } from '../../metadata/orm/prop';
import { ModelPropertiesSym } from '../../metadata/orm/model';
import { Types } from '../../metadata/orm/types';
import 'reflect-metadata';

export function Prop(columnName?: PropMetadata | string) {
    let meta: PropMetadata;
    if (typeof columnName === 'string') meta = { columnName: columnName };
    else meta = columnName || {};
    
    return function(model: any, propertyName: string) {
        let props: string[] = Reflect.getOwnMetadata(ModelPropertiesSym, model) || [];
        props.push(propertyName);
        Reflect.defineMetadata(ModelPropertiesSym, props, model);
        
        if (!meta.type) {
            let reflectType = Reflect.getMetadata('design:type', model, propertyName);
            let sequelizeType: any = null;
            if (reflectType === String) sequelizeType = Types.string;
            else if (reflectType === Number) {
                if (meta.primaryKey || meta.autoIncrement) sequelizeType = Types.integer;
                else sequelizeType = Types.float;
            }
            else if (reflectType === Date) sequelizeType = Types.date;
            else if (reflectType === Boolean) sequelizeType = Types.boolean;
            else throw new Error(`Could not infer column type for model property: ${propertyName}`);
            meta.type = sequelizeType;
        }
        Reflect.defineMetadata(PropMetadataSym, meta, model, propertyName);
    }
}
