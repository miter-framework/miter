/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as spies from 'chai-spies';
use(spies);

import { CrudController } from '../crud-controller';
import { Logger } from '../../services/logger';
import { Mock } from 'typemoq';

import { Injectable } from '../../decorators/services/injectable.decorator';

describe('CrudController', () => {
    
});
