const Database = require('./database.js');

module.exports = {
    migrate : async () => {
        let conn;
        try {
            conn = await Database.pool.getConnection();
            let query = 
            "CREATE TABLE IF NOT EXISTS summoner_queue (" +
                "id               INT NOT NULL AUTO_INCREMENT PRIMARY KEY," +
                "puuid            VARCHAR(128)," +
                "name             VARCHAR(128)," +
                "platformId       VARCHAR(12)  NOT NULL," +
                "created_at       BIGINT       NOT NULL," +
                "processed_status BOOLEAN      DEFAULT 0," +
                "processed_at     BIGINT" +
            ");";
            await conn.query(query);

        } catch (err) {
            throw err;
        } finally {
            if (conn) { conn.release(); } //release to pool
        }

    }
};