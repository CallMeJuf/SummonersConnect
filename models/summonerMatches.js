const DBHelper = require('../utils/db');
const Model    = require('./model');

class SummonerMatch extends Model {
    constructor(obj) {
        super(obj, KEYS);
    }

    async save(transactionConn) {
        return await super.save(KEYS, TABLE_NAME, transactionConn);
    }

    async destroy(transactionConn) {
        return await super.destroy(PRIMARY_KEYS, TABLE_NAME, transactionConn);
    }

    static async getByPUUID(puuid, transactionConn) {
        let summoner_matches = await DBHelper.query(`SELECT * FROM summoner_matches WHERE puuid=?`, [puuid], transactionConn);
        return summoner_matches.length != 0 ? summoner_matches.map(a => new SummonerMatch(a)) : false;
    }

    static async getMostRecentByPUUID(puuid, transactionConn) {
        let summoner_matches = await DBHelper.query(`SELECT * FROM summoner_matches WHERE puuid=? ORDER BY timestamp DESC LIMIT 1`, [puuid], transactionConn);
        return summoner_matches.length != 0 ? new SummonerMatch(summoner_matches[0]) : false;
    }

    static async getMatchingByPUUID(puuid1, puuid2, transactionConn) {
        let query = `SELECT s1.gameId, s1.platformId, s1.timestamp, s1.season, s1.queue, s1.champion as champion1, s2.champion as champion2, s1.role as role1, s2.role as role2, s1.lane as lane1, s2.lane as lane2
                    FROM summoner_matches s1 JOIN summoner_matches s2
                        ON s1.gameId = s2.gameId AND
                            s1.puuid =? AND
                            s2.puuid =?;`;
        let summoner_matches = await DBHelper.query(query, [puuid1, puuid2], transactionConn);
        return summoner_matches.length != 0 ? summoner_matches.map(match => {
                return [
                    new SummonerMatch({
                        platformId : match.platformId,
                        puuid      : puuid1,
                        gameId     : match.gameId,
                        champion   : match.champion1,
                        queue      : match.queue,
                        season     : match.season,
                        timestamp  : match.timestamp,
                        role       : match.role1,
                        lane       : match.lane1
                    }),
                    new SummonerMatch({
                        platformId : match.platformId,
                        puuid      : puuid2,
                        gameId     : match.gameId,
                        champion   : match.champion2,
                        queue      : match.queue,
                        season     : match.season,
                        timestamp  : match.timestamp,
                        role       : match.role2,
                        lane       : match.lane2
                    })
                ];
        }) : [];
    }

    static createFromMatchData(participant) {
        let summonerMatch = {
            platformId : participant.platformId

        };
        Object.keys(participant).forEach( key => {
            if ( KEYS[key] ) {
                summonerMatch[key] = participant[key];
            }
        });
        return new SummonerMatch(summonerMatch);
    }
}

const TABLE_NAME = "summoner_matches";
const PRIMARY_KEYS = {
    platformId : {
        required    : true,
        PRIMARY_KEY : true
    },
    puuid : {
        required    : true,
        PRIMARY_KEY : true
    },
    gameId : {
        required    : true,
        PRIMARY_KEY : true
    }
};
const KEYS = {
    ...PRIMARY_KEYS,
    champion  : {},
    queue     : {},
    season    : {},
    timestamp : {},
    role      : {
        DEFAULT : "NONE"
    },
    lane : {
        DEFAULT : "NONE"
    }
};

module.exports = SummonerMatch;