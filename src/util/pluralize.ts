import * as pFn from 'pluralize';

export function pluralize(str: string, plural: boolean = true): string {
    return pFn(str, plural ? 2 : 1);
}
