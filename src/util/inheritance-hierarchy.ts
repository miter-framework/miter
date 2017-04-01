

export function inhertitanceHierarchy(target: Function): Function[] {
    let hierarchy: Function[] = [];
    while (target) {
        hierarchy = [target, ...hierarchy];
        target = Object.getPrototypeOf(target);
    }
    hierarchy.splice(0, 1);
    return hierarchy;
}
