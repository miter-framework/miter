import { Types } from './types';

export type ReferenceCallbackAction = 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'SET NULL' | 'NO ACTION';

export type PropMetadata = {
    columnName?: string,
    type?: Types,
    enumValues?: string[],
    defaultValue?: any,
    
    // validate?: DefineValidateOptions,
    unique?: boolean | string | { name: string, msg: string },
    values?: string[],
    allowNull?: boolean,
    
    primaryKey?: boolean,
    autoIncrement?: boolean,
    
    comment?: string,
    
    // references?: DefineAttributeColumnReferencesOptions,
    onUpdate?: ReferenceCallbackAction,
    onDelete?: ReferenceCallbackAction,
    
    get?: () => any,
    set?: (val: any) => void
}
export const PropMetadataSym = Symbol.for('PropMetadata');
