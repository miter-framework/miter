

export function hasNoUndefined<T>(arr: (T | undefined)[]): arr is T[] {
    return !arr.find(val => typeof val === 'undefined');
}
