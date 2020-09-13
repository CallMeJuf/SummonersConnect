const DBHelper = require('../utils/db');
const CONSTS = {
    ERROR : {
        MISSING_REQUIRED_KEY : "Required key missing for model creation.",
        MISSING_TABLE_NAME   : "Table name is missing for model save."
    }
};

class Model {
    constructor(obj, keys){
        if ( typeof obj == "object" ){
            Object.keys(keys).forEach( key => {
                if ( obj[key] ) {
                    this[key] = obj[key];
                } else if ( keys[key].required ) {
                    throw new Error(CONSTS.ERROR.MISSING_REQUIRED_KEY);
                }
            }); 
        }
    }

    async save(keys, table_name, transactionConn, options = {}){
        if ( !table_name ) { throw new Error(CONSTS.ERROR.MISSING_TABLE_NAME); }
        
        let queryReplacementArray = getReplacementArray(keys, this);

        let query = `INSERT INTO ${table_name} (${queryReplacementArray.columns.join()}) VALUES(${Array(queryReplacementArray.values.length).fill("?").join()}) `;

        if ( !options.create ) {
            query = `${query}ON DUPLICATE KEY UPDATE ${queryReplacementArray.columns.map( col => `${col}=VALUES(${col})`).join()}`;
        } else if ( options.ignoreOnDuplicateKeyError ) {
            query = `${query}ON DUPLICATE KEY UPDATE ${queryReplacementArray.primary_keys.map( col => `${col}=VALUES(${col})`).join()}`;
        }
        return await DBHelper.query(query, queryReplacementArray.values, transactionConn);
    }

    async destroy(primary_keys, table_name, transactionConn) {
        let queryReplacementArray = getReplacementArray(primary_keys, this);

        let query = `DELETE FROM ${table_name} where ${queryReplacementArray.columns.map( key => `${key}=?` ).join(' AND ')};`;

        return await DBHelper.query(query, queryReplacementArray.values, transactionConn);
    }


}

function getReplacementArray(keys, that){
    let queryReplacementArray = {
        columns      : [],
        values       : [],
        primary_keys : Object.keys(keys).filter( key => keys[key].PRIMARY_KEY )
    };
    
    Object.keys(keys).forEach(key => {
        if ( that[key] ) {
            queryReplacementArray.columns.push(key);
            queryReplacementArray.values.push(that[key]);
        } else if ( keys[key].DEFAULT ) {
            queryReplacementArray.columns.push(key);
            queryReplacementArray.values.push(keys[key].DEFAULT);
        }
    });

    return queryReplacementArray;
}

module.exports = Model;