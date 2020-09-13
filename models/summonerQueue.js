const Model    = require('./model');
const DBHelper = require('../utils/db');
const Summoner = require('./summoner');
const Utils    = require('../utils/general');
const Riot     = require('../utils/riot');

const CONST = {
    PROCESS_STATUS : {
        PROCESSED   : 1,
        UNPROCESSED : 0 
    },
    PUUID : {
        SUMMONER_NOT_FOUND : "404"
    }
};
class SummonerQueue extends Model{
    constructor(obj) {
        super(obj, KEYS);
        this.created_at = this.created_at ? this.created_at : Date.now();
        this.name = Utils.toSafeName(this.name);
        return this;
    }

    async save(transactionConn) {
        return await super.save(KEYS, TABLE_NAME, transactionConn);
    }

    async finish(transactionConn) {
        let query = `UPDATE summoner_queue SET processed_status=?, processed_at=?, puuid=? WHERE platformId=? AND name=? AND processed_status=?;`;
        let queryReplacementArray = [
            CONST.PROCESS_STATUS.PROCESSED,
            Date.now(),
            this.puuid ? this.puuid : CONST.PUUID.SUMMONER_NOT_FOUND,
            this.platformId,
            Utils.toSafeName(this.name),
            CONST.PROCESS_STATUS.UNPROCESSED
        ];
        return await DBHelper.query(query, queryReplacementArray, transactionConn);
    }

    async destroy(transactionConn) {
        return await super.destroy(PRIMARY_KEYS, TABLE_NAME, transactionConn);
    }

    async getSummonerFromRiot() {
        return await Summoner.getByNameFromRiot(Utils.toSafeName(this.name), this.platformId);
    }

    static async find({ platformId, name, transactionConn = false }) {
        if ( !(platformId || name) ) { throw new Error("SummonerQueue missing required keys for creation."); }
        let querySelect = "SELECT * FROM summoner_queue where platformId=? AND name=? ORDER BY created_at DESC LIMIT 1";
        let queueObj = await DBHelper.query(querySelect, [platformId, Utils.toSafeName(name)], transactionConn);
        return queueObj.length != 0 ? new SummonerQueue(queueObj[0]) : false;
    }

    static async create({ platformId, name, transactionConn = false }) {
        if ( !(platformId || name)  || !Riot.SERVERS.includes(platformId)) { throw new Error("SummonerQueue missing required keys for creation."); }
        let now = Date.now();
        let query = "INSERT INTO summoner_queue (platformId, name, created_at, processed_status) VALUES(?,?,?,?)";
        let insert = await DBHelper.query(query, [platformId, Utils.toSafeName(name), now, CONST.PROCESS_STATUS.UNPROCESSED], transactionConn);
        return "insertId" in insert ? new SummonerQueue({
            id               : insert.insertId,
            platformId       : platformId,
            name             : Utils.toSafeName(name),
            created_at       : now,
            processed_status : CONST.PROCESS_STATUS.UNPROCESSED
        }) : false;
    }

    static async getQueue({ transactionConn }) {
        let querySelect = "SELECT * FROM summoner_queue where processed_status=?";
        let queue = await DBHelper.query(querySelect, [CONST.PROCESS_STATUS.UNPROCESSED], transactionConn);
        return queue.length != 0 ? queue.map( a => new SummonerQueue(a) ) : false;
    }

    static async getLastUpdate({ transactionConn, safename }) {
        let querySelect = "SELECT * FROM summoner_queue where processed_status=? AND name=? ORDER BY id DESC LIMIT 1";
        let queue = await DBHelper.query(querySelect, [CONST.PROCESS_STATUS.PROCESSED, safename], transactionConn);
        return queue.length != 0 ? new SummonerQueue(queue[0]) : false;
    }

    static async getTopQueue({ transactionConn, limit = 1 }) {
        let querySelect = "SELECT * FROM summoner_queue where processed_status=? ORDER BY id ASC LIMIT ?";
        let queue = await DBHelper.query(querySelect, [CONST.PROCESS_STATUS.UNPROCESSED, limit], transactionConn);
        return queue.length != 0 ? queue.map( a => new SummonerQueue(a) ) : [];
    }
}

const TABLE_NAME = "summoner_queue";
const PRIMARY_KEYS = {
    id : {
        required    : true,
        PRIMARY_KEY : true
    }
};
const KEYS = {
    ...PRIMARY_KEYS,
    puuid            : {},
    platformId       : {},
    name             : {},
    created_at       : {},
    processed_at     : {},
    processed_status : {}
};


module.exports = SummonerQueue;