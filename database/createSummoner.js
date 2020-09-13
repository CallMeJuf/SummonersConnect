const Database = require('./database.js');

module.exports = {
    migrate : async () => {
        let conn;
        try {
            conn = await Database.pool.getConnection();
            let query = 
            "CREATE TABLE IF NOT EXISTS summoner (" +
                "summonerId      VARCHAR(128)," +
                "accountId       VARCHAR(128)," +
                "matchhistoryId  INT          UNSIGNED," +
                "puuid           VARCHAR(128) PRIMARY KEY," +
                "name            VARCHAR(32)," +
                "safename        VARCHAR(32)," +
                "platformId      VARCHAR(6)," +
                "profileIconId   MEDIUMINT    UNSIGNED," +
                "revisionDate    BIGINT       UNSIGNED," +
                "processedAt     BIGINT       UNSIGNED," +
                "summonerLevel   SMALLINT     UNSIGNED" +
            ");";
            await conn.query(query);
        } catch (err) {
            throw err;
        } finally {
            if (conn) { conn.release(); } //release to pool
        }

    }
};