import { PolicyDescriptor } from '../core/policy';

export type TransformRouteT = {
    routeFnName: string,
    fullPath: string,
    policyDescriptors: PolicyDescriptor[]
};

export interface ControllerT {
    transformRoutePathPart?: { (routeFnName: string, part: string): string },
    transformRoutePath?: { (routeFnName: string, path: string): string },
    transformRoutePolicies?: { (routeFnName: string, fullPath: string, policies: PolicyDescriptor[]): PolicyDescriptor[] },
    
    transformRoute?: { (route: TransformRouteT): boolean | void }
}
