import { ClassNopsSym } from '../metadata';
import 'reflect-metadata';

export type NopFunc = () => void;
export type NopFuncDescriptor = TypedPropertyDescriptor<NopFunc>;
export type NopDecoratorFunc = (target: Object, propertyKey: string, propertyDescriptor: NopFuncDescriptor) => void;

export function Test(): NopDecoratorFunc {
    return function(classProto: any, methodName: string, nopFn: NopFuncDescriptor) {
        var classNops: string[] = Reflect.getOwnMetadata(ClassNopsSym, classProto) || [];
        if (!classNops.find(nop => nop == methodName)) classNops.push(methodName);
        Reflect.defineMetadata(ClassNopsSym, classNops, classProto);
    }
}
