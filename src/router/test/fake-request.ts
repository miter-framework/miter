import { Request } from 'express';

export function FakeRequest(): Request {
    let obj: any = {};
    ['params', 'param', 'query'].forEach(name => {
        obj[name] = function() { return obj; };
    });
    return obj;
}
