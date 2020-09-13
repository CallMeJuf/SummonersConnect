'use strict';
const mariadb = require('mariadb');
const Config = require('../config.js');

const pool = mariadb.createPool({
    host            : Config.Database.host, 
    user            : Config.Database.user, 
    database        : Config.Database.dbName,
    password        : Config.Database.password,
    connectionLimit : Config.Database.connectionLimit,
    debug           : false
});

module.exports = {
    pool : pool
};
