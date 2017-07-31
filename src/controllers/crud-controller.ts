import { Request, Response } from 'express';

import { StaticModelT, ModelT } from '../core/model';
import { CountAllResults } from '../core/db';
import { PolicyDescriptor } from '../core/policy';

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
export type PerformFindOneQueryT = {
    where: Object,
    include: string[],
    order: [string, string][]
};

export abstract class CrudController<T extends ModelT<any>> {
    constructor(
        private staticModel: StaticModelT<T>,
        protected readonly modelName: string,
        pluralName?: string,
        singularName?: string
    ) {
        this._singularName = singularName || this.getSingularPath(modelName);
        this._pluralName = pluralName || this.getPluralPath(modelName);
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
    private _singularName: string;
    get singularName() {
        return this._singularName;
    }
    private _pluralName: string;
    get pluralName() {
        return this._pluralName;
    }
    
    transformPathPart(routeFnName: string, part: string): string {
        return part.replace(/%%PLURAL_NAME%%/g, this._pluralName).replace(/%%SINGULAR_NAME%%/g, this._singularName);
    }
    transformRoutePolicies(routeFnName: string, fullPath: string, policies: PolicyDescriptor[]): PolicyDescriptor[] {
        switch (routeFnName) {
        case 'create':
        case 'update':
        case 'destroy':
            return [...policies, ...this.getReadPolicies(), ...this.getMutatePolicies()];
        case 'find':
        case 'count':
        case 'get':
            return [...policies, ...this.getReadPolicies()];
        default:
            return policies;
        }
    }
    
    protected getReadPolicies(): PolicyDescriptor[] {
        return [];
    }
    protected getMutatePolicies(): PolicyDescriptor[] {
        return [];
    }
    
    protected async transformInclude(req: Request, res: Response, include: string[]): Promise<string[] | void> {
    }
    
    protected async transformQuery(req: Request, res: Response, query: Object): Promise<Object | boolean> {
        return query;
    }
    protected async performQuery(req: Request, res: Response, query: PerformQueryT) {
        return await this.staticModel.db.findAndCountAll(<any>query);
    }
    protected async performFindOneQuery(req: Request, res: Response, query: PerformFindOneQueryT) {
        return await this.staticModel.db.findOne(<any>query);
    }
    protected async transformQueryResults(req: Request, res: Response, results: CountAllResults<T>) {
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
    
    protected async transformCreateQuery(req: Request, res: Response, query: Object): Promise<Object | false> {
        return query;
    }
    protected async performCreate(req: Request, res: Response, data: object) {
        return await this.staticModel.db.create(data);
    }
    protected async transformCreateResult(req: Request, res: Response, result: T) {
        return result;
    }
    
    protected async transformUpdateQuery(req: Request, res: Response, query: Object): Promise<Object | false> {
        return query;
    }
    protected async performUpdate(req: Request, res: Response, id: string | number, data: object, returning: boolean) {
        return await this.staticModel.db.update(id, data, returning);
    }
    protected async transformUpdateResult(req: Request, res: Response, result: T) {
        return result;
    }
    
    protected async beforeCreate(req: Request, res: Response, data: Object) {
    }
    protected async afterCreate(req: Request, res: Response, result: T) {
    }
    
    protected async beforeUpdate(req: Request, res: Response, updateId: number, data: Object) {
    }
    protected async afterUpdate(req: Request, res: Response, updateId: number, result?: T | null) {
    }
    
    protected async beforeDestroy(req: Request, res: Response, destroyId: number) {
    }
    protected async afterDestroy(req: Request, res: Response, destroyId: number) {
    }
    
    @Post(`/%%PLURAL_NAME%%/create`)
    async create(req: Request, res: Response) {
        let initialStatusCode = res.statusCode;
        let data = await this.transformCreateQuery(req, res, req.body) || req.body;
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        if (!data) {
            res.status(HTTP_STATUS_ERROR).send(`You haven't sent any data to create the ${this.modelName} with!`);
            return;
        }
        if (data.constructor == Array) {
            throw new Error("createMany not supported");
        }
        
        await this.beforeCreate(req, res, data);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        let result: T = await this.performCreate(req, res, data);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        result = await this.transformCreateResult(req, res, result);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        await this.afterCreate(req, res, result);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        res.status(HTTP_STATUS_OK).json(result);
    }
    
    @Get(`/%%PLURAL_NAME%%/find`)
    @Get(`/%%PLURAL_NAME%%/find-one`)
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
        
        include = include || [];
        include = await this.transformInclude(req, res, include) || include;
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        let findOne = req.path.endsWith('find-one');
        if (findOne) {
            let result = await this.performFindOneQuery(req, res, {
                where: query,
                include: include,
                order: order
            });
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
            
            result = await this.transformResult(req, res, result);
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
            
            res.status(HTTP_STATUS_OK).json(result);
        }
        else {
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
        
        let initialStatusCode = res.statusCode;
        include = include || [];
        include = await this.transformInclude(req, res, include) || include;
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        let result = await this.staticModel.db.findById(id, <any>{ include: include });
        
        result = await this.transformResult(req, res, result);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        res.status(HTTP_STATUS_OK).json(result);
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
        let data = await this.transformUpdateQuery(req, res, req.body) || req.body;
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        if (!data) {
            res.status(HTTP_STATUS_ERROR).send(`You haven't sent any data to update the ${this.modelName} with!`);
            return;
        }
        let returning = false;
        let returningParam = req.query['returning'];
        if (returningParam) {
            if (returningParam === true || returningParam === 'true') returning = true;
            else if (returningParam === false || returningParam === 'false') returning = false;
            else {
                res.status(HTTP_STATUS_ERROR).send(`Invalid ${this.modelName} returning parameter: ${returningParam}; must be boolean`);
                return;
            }
        }
        
        await this.beforeUpdate(req, res, id, data);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        let performUpdateResults = await this.performUpdate(req, res, id, data, returning);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        let [updated, results] = performUpdateResults;
        if (results && results.length > 1) throw new Error(`performUpdate returned multiple results`);
        
        if (updated) {
            results = await Promise.all(results.map((result: any) => this.transformUpdateResult(req, res, result)));
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
            
            let result = returning ? results[0] : undefined;
            await this.afterUpdate(req, res, id, result);
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
            
            res.status(HTTP_STATUS_OK).json(result);
        }
        else {
            res.status(HTTP_STATUS_ERROR).send(`Can't find the ${this.modelName} with id ${id} to update it.`);
            return;
        }
    }
    
    @Delete(`/%%SINGULAR_NAME%%/:id`)
    async destroy(req: Request, res: Response) {
        let id = parseInt(req.params['id'], 10);
        if (!id || isNaN(id)) {
            res.status(HTTP_STATUS_ERROR).send(`Invalid ${this.modelName} id: ${req.params['id']}`);
            return;
        }
        
        let initialStatusCode = res.statusCode;
        await this.beforeDestroy(req, res, id);
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        let destroyed = await this.staticModel.db.destroy(id);
        
        if (destroyed) {
            await this.afterDestroy(req, res, id);
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
            
            res.status(HTTP_STATUS_OK).end();
        }
        else {
            res.status(HTTP_STATUS_ERROR).send({ msg: `Failed to delete ${this._singularName} with ID ${id}.` });
        }
    }
}
