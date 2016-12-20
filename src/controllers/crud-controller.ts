import * as express from 'express';
import { StaticModelT, ModelT } from '../core';
import { Controller, Get, Post, Put, Patch, Delete } from '../decorators';
import { pluralize } from '../util/pluralize';

export abstract class CrudController<T extends ModelT<any>> {
    constructor(private staticModel: StaticModelT<T>, private modelName: string, pluralName?: string, singularName?: string) {
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
    
    async transformQuery(req: express.Request, res: express.Response, query: Object) {
        return query;
    }
    async transformResult(req: express.Request, res: express.Response, result: T | null) {
        return result;
    }
    
    @Post(`/%%PLURAL_NAME%%/create`)
    async create(req: express.Request, res: express.Response) {
        let data = req.body;
        if (!data) {
            res.status(400).send(`You haven't sent any data to create the ${this.modelName} with!`);
            return;
        }
        let result = await this.staticModel.db.create(data);
        res.status(200).json(result);
    }
    
    @Get(`/%%PLURAL_NAME%%/find`)
    async find(req: express.Request, res: express.Response) {
        let query: any = {};
        let include: string[] = [];
        try {
            if (req.query['query'])
                query = JSON.parse(decodeURIComponent(req.query['query'])) || {};
            if (req.query['include'])
                include = JSON.parse(decodeURIComponent(req.query['include'])) || [];
        }
        catch (e) {
            res.status(400).send(`Could not parse request parameters.`);
            return;
        }
        
        let initialStatusCode = res.statusCode;
        query = await this.transformQuery(req, res, query) || query;
        if (res.statusCode !== initialStatusCode || res.headersSent) return;
        
        let perPage = req.query['perPage'];
        if (!perPage || !(perPage = parseInt('' + perPage, 10)) || isNaN(perPage) || perPage < 0) perPage = 10;
        let page = req.query['page'];
        if (!page || !(page = parseInt('' + page, 10)) || isNaN(page) || page < 0) page = 0;
        
        let results = await this.staticModel.db.findAndCountAll({
            where: query,
            include: include,
            offset: perPage * page,
            limit: perPage
        });
        res.status(200).json({
            results: results.results,
            page: page,
            perPage: perPage,
            total: results.count
        });
    }
    
    @Get(`/%%SINGULAR_NAME%%/:id`)
    async get(req: express.Request, res: express.Response) {
        let id = parseInt(req.params['id'], 10);
        if (!id || isNaN(id)) {
            res.status(400).send(`Invalid ${this.modelName} id: ${req.params['id']}`);
            return;
        }
        
        let result = await this.staticModel.db.findById(id);
        let initialStatusCode = res.statusCode;
        result = await this.transformResult(req, res, result);
        if (res.statusCode === initialStatusCode && !res.headersSent) res.status(200).json(result);
    }
    
    @Put(`/%%SINGULAR_NAME%%/:id`)
    @Patch(`/%%SINGULAR_NAME%%/:id`)
    async update(req: express.Request, res: express.Response) {
        let id = parseInt(req.params['id'], 10);
        if (!id || isNaN(id)) {
            res.status(400).send(`Invalid ${this.modelName} id: ${req.params['id']}`);
            return;
        }
        let data = req.body;
        if (!data) {
            res.status(400).send(`You haven't sent any data to update the ${this.modelName} with!`);
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
                res.status(400).send(`Invalid ${this.modelName} returning parameter: ${returningParam}; must be boolean`);
                return;
            }
        }
        
        let [updated, results] = await this.staticModel.db.update(id, data, returning);
        if (!updated) {
            res.status(400).send(`Can't find the ${this.modelName} with id ${id} to update it.`);
            return;
        }
        if (returning)
            res.status(200).json(results[0]);
        else
            res.status(200).end();
    }
    
    @Delete(`/%%SINGULAR_NAME%%/:id`)
    async destroy(req: express.Request, res: express.Response) {
        let id = parseInt(req.params['id'], 10);
        if (!id || isNaN(id)) {
            res.status(400).send(`Invalid ${this.modelName} id: ${req.params['id']}`);
            return;
        }
        let destroyed = await this.staticModel.db.destroy(id);
        res.status(200).json({destroyed: destroyed});
    }
}
