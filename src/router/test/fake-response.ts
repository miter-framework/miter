import { Response } from 'express';

export function FakeResponse(): Response {
    let obj: any = {
        statusCode: 0
    };
    ['send', 'json', 'end'].forEach(name => {
        obj[name] = function() { return obj; };
    });
    obj.status = function(status: number) {
        obj.statusCode = status;
        return obj;
    }
    return obj;
}
