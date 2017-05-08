import { Request, Response, Handler, NextFunction } from 'express';
import { wrapPromise } from '../util/wrap-promise';
import { sendFiles } from './static-send-files';

export function monkeypatchRequest(req: Request, res: Response, next: NextFunction) {
    let origSendFile = <any>res.sendFile;
    (<any>res).sendfile = (<any>res).sendFile = async (path: string, options: any, errback?: any) => {
        if (!errback && typeof options === 'function') {
            errback = options;
            options = undefined;
        }
        if (errback) origSendFile(path, options, errback);
        else await wrapPromise(origSendFile.bind(res), path, options);
    }
    (<any>res).sendFiles = sendFiles;
    next();
}
