import { Request, Response } from 'express';

import { StaticModelT, ModelT } from '../core/model';
import { CountAllResults } from '../core/db';

import { Controller } from '../decorators/router/controller.decorator';
import { Get, Post, Put, Patch, Delete } from '../decorators/router/routes';

import { pluralize } from '../util/pluralize';
import { HTTP_STATUS_OK, HTTP_STATUS_ERROR } from '../util/http-status-type';

export type PerformQueryT = {
    where: Object,
    include: string[],
    order: [string, string][],
    offset: number,
    limit: number
};

export abstract class CrudController<T extends ModelT<any>> {
    constructor(private staticModel: StaticModelT<T>, protected readonly modelName: string, pluralName?: string, singularName?: string) {
        this.singularName = singularName || this.getSingularPath(modelName);
        this.pluralName = pluralName || this.getPluralPath(modelName);
    }
    private *splitOnWords(name: string) {
        let currentWord = '';
        for (let q = 0; q < name.length; q++) {
            let chr = name[q];
            if (chr.match(/[A-Z]/)) {
                if (currentWord) yield currentWord;
                currentWord = chr;
            }
            else if (chr == '_') {
                if (currentWord) yield currentWord;
                currentWord = '';
            }
            else currentWord += chr;
        }
        if (currentWord) yield currentWord;
    }
    private getSingularPath(name: string): string {
        let parts = [...this.splitOnWords(name)].filter(Boolean);
        if (!parts.length) return name;
        parts[parts.length - 1] = pluralize(parts[parts.length - 1], false);
        return parts.map(pt => pt.toLowerCase()).join('-');
    }
    private getPluralPath(name: string): string {
        let parts = [...this.splitOnWords(name)].filter(Boolean);
        if (!parts.length) return name;
        parts[parts.length - 1] = pluralize(parts[parts.length - 1]);
        return parts.map(pt => pt.toLowerCase()).join('-');
    }
    private singularName: string;
    private pluralName: string;
    
    transformPathPart(part: string): string {
        return part.replace(/%%PLURAL_NAME%%/, this.pluralName).replace(/%%SINGULAR_NAME%%/, this.singularName);
    }
    
    protected async transformQuery(req: Request, res: Response, query: Object) {
        return query;
    }
    protected async performQuery(req: Request, res: Response, query: PerformQueryT) {
        return await this.staticModel.db.findAndCountAll(<any>query);
    }
    protected async transformQueryResults(req: Request, res:Response, results: CountAllResults<T>) {
        let initialStatusCode = res.statusCode;
        let oldResults = results.results;
        let newResults: T[] = [];
        
        for (let q = 0; q < oldResults.length; q++) {
            let transformed = await this.transformResult(req, res, oldResults[q]);
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
            if (transformed) newResults.push(transformed);
        }
        return {
            results: newResults,
            count: results.count
        };
    }
    
    protected async transformResult(req: Request, res: Response, result: T | null) {
        return result;
    }
    protected async transformCreateQuery(req: Request, res: Response, query: Object) {
        return query;
    }
    protected async transformCreateResult(req: Request, res: Response, result: T) {
        return result;
    }
    protected async transformUpdateQuery(req: Request, res: Response, query: Object) {
        return query;
    }
    protected async transformUpdateResult(req: Request, res: Response, result: T) {
        return result;
    }
    
    @Post(`/%%PLURAL_NAME%%/create`)
    async create(req: Request, res: Response) {
        let initialStatusCode = res.statusCode;
        let data = await this.transformCreateQuery(req, res, req.body);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        if (!data) {
            res.status(HTTP_STATUS_ERROR).send(`You haven't sent any data to create the ${this.modelName} with!`);
            return;
        }
        if (data.constructor == Array) {
            throw new Error("createMany not supported");
        }
        
        let result: T = await this.staticModel.db.create(data);
        
        result = await this.transformCreateResult(req, res, result);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        this.afterCreate(req, res, result);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        res.status(HTTP_STATUS_OK).json(result);
    }
    
    protected async afterCreate(req: Request, res: Response, result: T) {
    }
    
    @Get(`/%%PLURAL_NAME%%/find`)
    async find(req: Request, res: Response) {
        let query: any = {};
        let include: string[] = [];
        let order: [string, string][] = [];
        try {
            if (req.query['query']) query = JSON.parse(req.query['query'] || '{}');
            if (req.query['include']) include = JSON.parse(req.query['include'] || '[]');
            if (req.query['order']) order = JSON.parse(req.query['order'] || '[]');
        }
        catch (e) {
            res.status(HTTP_STATUS_ERROR).send(`Could not parse request parameters.`);
            return;
        }
        
        if ((!include || !include.length) && query.include) {
            include = query.include;
            delete query.include;
        }
        if ((!order || !order.length) && query.order) {
            order = query.order;
            delete query.order;
        }
        
        let initialStatusCode = res.statusCode;
        query = await this.transformQuery(req, res, query) || query;
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        let perPage = req.query['perPage'];
        if (!perPage || !(perPage = parseInt('' + perPage, 10)) || isNaN(perPage) || perPage <= 0) perPage = 10;
        let page = req.query['page'];
        if (!page || !(page = parseInt('' + page, 10)) || isNaN(page) || page < 0) page = 0;
        
        let results = await this.performQuery(req, res, {
            where: query,
            include: include,
            order: order,
            offset: page * perPage,
            limit: perPage
        });
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        results = (await this.transformQueryResults(req, res, results))!;
        if (res.statusCode !== initialStatusCode || res.headersSent || !results) return;
        
        res.status(HTTP_STATUS_OK).json({
            results: results.results,
            page: page,
            perPage: perPage,
            total: results.count
        });
    }
    
    @Get(`/%%PLURAL_NAME%%/count`)
    async count(req: Request, res: Response) {
        let query: any = {};
        try {
            if (req.query['query']) query = JSON.parse(req.query['query'] || '{}');
        }
        catch(e) {
            res.status(HTTP_STATUS_ERROR).send(`Could not parse query parameters`);
            return;
        }
        
        let initialStatusCode = res.statusCode;
        query = await this.transformQuery(req, res, query) || query;
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        let count = await this.staticModel.db.count({
            where: query
        });
        res.status(HTTP_STATUS_OK).send(`${count}`);
    }
    
    @Get(`/%%SINGULAR_NAME%%/:id`)
    async get(req: Request, res: Response) {
        let id = parseInt(req.params['id'], 10);
        if (!id || isNaN(id)) {
            res.status(HTTP_STATUS_ERROR).send(`Invalid ${this.modelName} id: ${req.params['id']}`);
            return;
        }
        
        let include: string[] = [];
        try {
            if (req.query['include']) include = JSON.parse(req.query['include'] || '[]');
        }
        catch (e) {
            res.status(HTTP_STATUS_ERROR).send(`Could not parse request parameters.`);
            return;
        }
        
        let result = await this.staticModel.db.findById(id, { include: include });
        let initialStatusCode = res.statusCode;
        result = await this.transformResult(req, res, result);
        if (res.statusCode === initialStatusCode && !res.headersSent) res.status(HTTP_STATUS_OK).json(result);
    }
    
    @Put(`/%%SINGULAR_NAME%%/:id`)
    @Patch(`/%%SINGULAR_NAME%%/:id`)
    async update(req: Request, res: Response) {
        let id = parseInt(req.params['id'], 10);
        if (!id || isNaN(id)) {
            res.status(HTTP_STATUS_ERROR).send(`Invalid ${this.modelName} id: ${req.params['id']}`);
            return;
        }
        let initialStatusCode = res.statusCode;
        let data = await this.transformUpdateQuery(req, res, req.body);
        if (res.statusCode !== initialStatusCode || res.headersSent) {
            return;
        }

        if (!data) {
            res.status(HTTP_STATUS_ERROR).send(`You haven't sent any data to update the ${this.modelName} with!`);
            return;
        }
        let returning = false;
        let returningParam = req.query['returning'];
        if (returningParam) {
            if (returningParam == true || returningParam == 'true')
                returning = true;
            else if (returningParam == false || returningParam == 'false')
                returning = false;
            else {
                res.status(HTTP_STATUS_ERROR).send(`Invalid ${this.modelName} returning parameter: ${returningParam}; must be boolean`);
                return;
            }
        }
        
        let [updated, results] = await this.staticModel.db.update(id, data, returning);
        
        initialStatusCode = res.statusCode;
        results = await Promise.all(results.map((result: any) => this.transformUpdateResult(req, res, result)));
        if (res.statusCode !== initialStatusCode || res.headersSent) {
            return;
        }
        
        if (!updated) {
            res.status(HTTP_STATUS_ERROR).send(`Can't find the ${this.modelName} with id ${id} to update it.`);
            return;
        }
        if (returning)
            res.status(HTTP_STATUS_OK).json(results[0]);
        else
            res.status(HTTP_STATUS_OK).end();
    }
    
    @Delete(`/%%SINGULAR_NAME%%/:id`)
    async destroy(req: Request, res: Response) {
        let id = parseInt(req.params['id'], 10);
        if (!id || isNaN(id)) {
            res.status(HTTP_STATUS_ERROR).send(`Invalid ${this.modelName} id: ${req.params['id']}`);
            return;
        }
        let destroyed = await this.staticModel.db.destroy(id);
        res.status(HTTP_STATUS_OK).json({destroyed: destroyed});
    }
}
