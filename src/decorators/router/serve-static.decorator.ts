import { CtorT } from '../../core/ctor';
import { ControllerT } from '../../core/controller';
import { ControllerMetadata, ControllerMetadataSym } from '../../metadata';
import * as express from 'express';
import * as expressStatic from 'serve-static';
import { ServeStaticPolicy } from '../../policies/serve-static.policy';

export function ServeStatic(root: string, options?: expressStatic.ServeStaticOptions) {
    return function(controller: CtorT<ControllerT>) {
        let meta: ControllerMetadata = Reflect.getOwnMetadata(ControllerMetadataSym, controller.prototype);
        if (!meta) meta = <any>{ extension: true };
        if (!meta.policies) meta.policies = [];
        meta.policies.push(new ServeStaticPolicy(root, options));
        Reflect.defineMetadata(ControllerMetadataSym, meta, controller.prototype);
    }
}
