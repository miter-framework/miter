import * as sequelize from 'sequelize';

export type Migration = {
    up: (queryInterface: sequelize.QueryInterface, sequelize: sequelize.Sequelize) => Promise<void>
    down: (queryInterface: sequelize.QueryInterface, sequelize: sequelize.Sequelize) => Promise<void>
}
