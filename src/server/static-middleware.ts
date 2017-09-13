import { Request, Response, Handler, NextFunction, Application as ExpressApp } from 'express';
import { Injector } from '../core/injector';
import { wrapPromise } from '../util/wrap-promise';
import { sendFiles } from './static-send-files';
import { TemplateService } from '../services/template.service';
import { HTTP_STATUS_OK } from '../util/http-status-type';

import pathStatic = require('path');
const pathJoin = pathStatic.join.bind(pathStatic);

export function monkeypatchResponseSendFile(req: Request, res: Response, next: NextFunction) {
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

export function monkeypatchResponseRender(injector: Injector, app: ExpressApp) {
    return function(req: Request, res: Response, next: NextFunction) {
        let origRender = <any>res.render;
        (<any>res).render = async (path: string, opts: any, errback?: any) => {
            let root = app.get('views');
            if (root && !path.startsWith('/')) path = pathJoin(root, path);
            let templateService = injector.resolveInjectable(TemplateService);
            if (!templateService) throw new Error(`Cannot render using the miter view engine. No TemplateService provided`);
            let result = await templateService.render(path, opts);
            res.status(HTTP_STATUS_OK).send(result);
        }
        next();
    }
}
