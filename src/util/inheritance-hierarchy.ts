

export function inhertitanceHierarchy(target: Function): Function[] {
    let hierarchy: Function[] = [];
    if (target.constructor) target = target.constructor;
    while (target) {
        hierarchy = [target, ...hierarchy];
        let proto = Object.getPrototypeOf(target.prototype);
        target = proto && proto.constructor;
    }
    return hierarchy;
}
