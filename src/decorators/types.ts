import * as sequelize from 'sequelize';

export var STRING = sequelize.STRING;
export var TEXT = sequelize.TEXT;
export var INTEGER = sequelize.INTEGER;
export var BIGINT = sequelize.BIGINT;
export var FLOAT = sequelize.FLOAT;
export var REAL = sequelize.REAL;
export var DOUBLE = sequelize.DOUBLE;
export var DECIMAL = sequelize.DECIMAL;
export var DATE = sequelize.DATE;
export var DATEONLY = sequelize.DATEONLY;
export var BOOLEAN = sequelize.BOOLEAN;
export var ENUM = sequelize.ENUM;
export var UUID = sequelize.UUID;
export var VIRTUAL = sequelize.VIRTUAL;

//PostgreSQL only:
export var ARRAY = sequelize.ARRAY;
export var JSON = sequelize.JSON;
export var JSONB = sequelize.JSONB;
export var BLOB = sequelize.BLOB;
export var RANGE = sequelize.RANGE;
export var GEOMETRY = sequelize.GEOMETRY;
