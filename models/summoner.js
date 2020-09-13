const DBHelper        = require('../utils/db');
const Model           = require('./model');
const SummonerMatches = require('./summonerMatches.js');
const Riot            = require('../utils/riot.js');
const Utils           = require('../utils/general');

class Summoner extends Model {
    constructor(obj) {
        super(obj, KEYS);
        this.matches = this.matches ? this.matches : [];
        return this;
    }

    async save(transactionConn, options ) {
        this.safename = this.getSafeName();
        let save_opts = { create: options.create, ignoreOnDuplicateKeyError: options.ignoreOnDuplicateKeyError };
        let summoner = await super.save(KEYS, TABLE_NAME, transactionConn, save_opts);
        if ( options.eager && this.matches ){
            for ( let i in this.matches ){
                await this.matches[i].save(transactionConn);
            }
        }
        return summoner;
    }

    async destroy(transactionConn) {
        return await super.destroy(PRIMARY_KEYS, TABLE_NAME, transactionConn);
    }

    getSafeName() {
        return Utils.toSafeName(this.name);
    }

    async getMatchList() {
        let matches = await SummonerMatches.getByPUUID(this.puuid);
        if ( matches ){
            this.matches.push(...matches);
        }
        return matches;
    }

    async getMatchListFromRiot() {
        let recent_timestamp = await SummonerQueue.getLastUpdate({ safename: Utils.toSafeName(this.name) });
        recent_timestamp = recent_timestamp ? recent_timestamp.processed_at : 0;
        let matches = await Riot.Match.listAll({ accountId: this.accountId, searchUntilTimestamp: recent_timestamp, platformId: this.platformId });
        if ( matches ){
            matches = matches.map( a => new SummonerMatches(Object.assign({ puuid: this.puuid }, a)));
            this.matches.push(...matches);
        }
        return matches;
    }

    async getMatchListWithSummoner(summoner2) {
        return await SummonerMatches.getMatchingByPUUID(this.puuid, summoner2.puuid);
    }

    static async getByPUUID(puuid, transactionConn) {
        let summoner = await DBHelper.query(`SELECT * FROM summoner WHERE puuid=?`, [puuid], transactionConn);
        return summoner.length != 0 ? new Summoner(summoner[0]) : false;
    }
    
    static async getByName({ name, platformId, transactionConn }) {
        let summoner = await DBHelper.query(`SELECT * FROM summoner WHERE safename=? AND platformId=? ORDER BY revisionDate DESC`, [Utils.toSafeName(name), platformId], transactionConn);
        return summoner.length != 0 ? new Summoner(summoner[0]) : false;
    }

    static async getByAccountIdFromRiot(accountId, region = 'NA') {
        let summoner = await Riot.Summoner.getByAccountId({ accountId: accountId, platformId: region });
        return summoner ? new Summoner(Object.assign({ summonerId: summoner.id, platformId: region }, summoner)) : false;
    }

    static async getByNameFromRiot(name, region = 'NA') {
        let summoner = await Riot.Summoner.getByName({ name: name, platformId: region });
        return summoner ? new Summoner(Object.assign({ summonerId: summoner.id, platformId: region }, summoner)) : false;
    }
}

const TABLE_NAME = "summoner";
const PRIMARY_KEYS = {
    puuid : {
        required    : true,
        PRIMARY_KEY : true
    }
};
const KEYS = {
    ...PRIMARY_KEYS,
    summonerId     : {},
    accountId      : {},
    matchhistoryId : {},
    safename       : {},
    name           : {},
    profileIconId  : {},
    revisionDate   : {},
    processedAt    : {},
    platformId     : {},
    summonerLevel  : {}
};


module.exports = Summoner;

const SummonerQueue = require('./summonerQueue.js');
