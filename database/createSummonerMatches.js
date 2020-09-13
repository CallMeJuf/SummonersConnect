const Database = require('./database.js');

module.exports = {
    migrate : async () => {
        let conn;
        try {
            conn = await Database.pool.getConnection();
            let query = 
            "CREATE TABLE IF NOT EXISTS summoner_matches (" +
                "puuid      VARCHAR(128)," +
                "platformId VARCHAR(12)," +
                "role       VARCHAR(25)," +
                "lane       VARCHAR(25)," +
                "gameId     BIGINT   UNSIGNED," +
                "champion   SMALLINT UNSIGNED," +
                "queue      SMALLINT UNSIGNED," +
                "season     TINYINT  UNSIGNED," +
                "timestamp  BIGINT   UNSIGNED," +
                "PRIMARY KEY (puuid, gameId, platformId)," +
                "FOREIGN KEY (puuid) REFERENCES summoner(puuid)" +
            ");";
            await conn.query(query);
        } catch (err) {
            throw err;
        } finally {
            if (conn) { conn.release(); } //release to pool
        }

    }
};