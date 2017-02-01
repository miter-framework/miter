import * as sequelize from 'sequelize';

export let STRING = sequelize.STRING;
export let TEXT = sequelize.TEXT;
export let INTEGER = sequelize.INTEGER;
export let BIGINT = sequelize.BIGINT;
export let FLOAT = sequelize.FLOAT;
export let REAL = sequelize.REAL;
export let DOUBLE = sequelize.DOUBLE;
export let DECIMAL = sequelize.DECIMAL;
export let DATE = sequelize.DATE;
export let DATEONLY = sequelize.DATEONLY;
export let BOOLEAN = sequelize.BOOLEAN;
export let ENUM = sequelize.ENUM;
export let UUID = sequelize.UUID;
export let VIRTUAL = sequelize.VIRTUAL;

//PostgreSQL only:
export let ARRAY = sequelize.ARRAY;
export let JSON = sequelize.JSON;
export let JSONB = sequelize.JSONB;
export let BLOB = sequelize.BLOB;
export let RANGE = sequelize.RANGE;
export let GEOMETRY = sequelize.GEOMETRY;
