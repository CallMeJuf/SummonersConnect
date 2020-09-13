const Database = require('../database/database');
module.exports = {
    query : async (query, queryReplacementArray, transactionConn) => {
        let transaction = true;
        let conn = transactionConn;
        let obj = false;
        try {
            if (!conn) {
                conn = await Database.pool.getConnection();
                transaction = false;
            }
            obj = await conn.query(query, queryReplacementArray);
        } catch (err) {
            throw err;
        } finally {
            if (conn && !transaction) { conn.release(); } //release to pool
        }
        return obj;
    }
};