const got = require('got');
const Config = require('../config.js');

const CONSTS = {
    API_KEY    : Config.Riot.API_KEY,
    platformId : {   
        NA   : "NA1",
        EUNE : "EUN1",
        EUW  : "EUW1",
        RU   : "RU",
        KR   : "KR",
        TR   : "TR1",
        BR   : "BR1",
        OCE  : "OC1",
        JP   : "JP1",
        LAN  : "LA1",
        LAS  : "LA2" 
    },
    baseURL  : '.api.riotgames.com/lol/',
    summoner : {
        getByName      : 'summoner/v4/summoners/by-name/',
        getByPUUID     : 'summoner/v4/summoners/by-puuid/',
        getByAccountId : 'summoner/v4/summoners/by-account/'
    },
    match : {
        getList : 'match/v4/matchlists/by-account/',
        getById : 'match/v4/matches/' 
    },
    ERRORS : {
        SUMMONER_NOT_FOUND  : new Error("Summoner Not Found ( 404 )"),
        MATCHLIST_NOT_FOUND : new Error("Summoner Matchlist Not Found ( 404 )")
    }
};
CONSTS.SERVERS = Object.keys(CONSTS.platformId);

let got_opts =  {
    headers : {
        "X-Riot-Token" : CONSTS.API_KEY
    },
    responseType : 'json'
};

module.exports = {
    Summoner : {
        getByPUUID : async ({ puuid, platformId = 'NA' }) => {
            let url = `https://${CONSTS.platformId[platformId]}${CONSTS.baseURL}${CONSTS.summoner.getByPUUID}${puuid}`;
            try {
                const {
                    body
                } = await got(url, got_opts);
                return body;
            } catch (error) {
                if ( error.response && error.response.statusCode == 404 ) { throw CONSTS.ERRORS.SUMMONER_NOT_FOUND; }
                console.log(`Error on URL: ${url}`);
                throw error;
            }
        },
        getByAccountId : async ({ accountId, platformId = 'NA' }) => {
            let url = `https://${CONSTS.platformId[platformId]}${CONSTS.baseURL}${CONSTS.summoner.getByAccountId}${accountId}`;
            try {
                const {
                    body
                } = await got(url, got_opts);
                return body;
            } catch (error) {
                if ( error.response && error.response.statusCode == 404 ) { throw CONSTS.ERRORS.SUMMONER_NOT_FOUND; }
                console.log(`Error on URL: ${url}`);
                throw error;
            }
        },
        getByName : async ({ name, platformId = 'NA' }) => {
            let url = `https://${CONSTS.platformId[platformId]}${CONSTS.baseURL}${CONSTS.summoner.getByName}${name}`;
            try {
                const {
                    body
                } = await got(url, got_opts);
                return body;
            } catch (error) {
                if ( error.response && error.response.statusCode == 404 ) { throw CONSTS.ERRORS.SUMMONER_NOT_FOUND; }
                console.log(`Error on URL: ${url}`);
                throw error;
            }
        }
    },

    Match : {
        list : async ( { accountId, beginIndex = 0, platformId = 'NA' }) => {
            let url = `https://${CONSTS.platformId[platformId]}${CONSTS.baseURL}${CONSTS.match.getList}${accountId}?beginIndex=${beginIndex}`;
            try {
                const {
                    body
                } = await got(url, got_opts);
                return body;
            } catch (error) {
                if ( error.response && error.response.statusCode == 404 ) { throw CONSTS.ERRORS.SUMMONER_NOT_FOUND; }
                console.log(`Error on URL: ${url}`);
                throw error;
            }
        },
        listAll : async ( { accountId, searchUntilTimestamp = 0, platformId = 'NA' } ) => {
            let endIndex = 0;
            let totalGames = 100;
            let games = [];
            let url = `https://${CONSTS.platformId[platformId]}${CONSTS.baseURL}${CONSTS.match.getList}${accountId}?beginIndex=9999999`;
            try {
                totalGames = (await got(url, got_opts)).body.totalGames;
                for ( let beginIndex = 0; endIndex < totalGames; beginIndex += 100 ){
                    url = `https://${CONSTS.platformId[platformId]}${CONSTS.baseURL}${CONSTS.match.getList}${accountId}?beginIndex=${beginIndex}`;
                    const { body } = await got(url, got_opts);
                    endIndex = body.endIndex;
                    games.push(...body.matches);
                    if ( body.matches.some( a => a.timestamp < searchUntilTimestamp ) ) { break; }
                }
            } catch ( error ){
                if ( error.response && error.response.statusCode == 404 ) { throw CONSTS.ERRORS.MATCHLIST_NOT_FOUND; }
                console.log(`Error on URL: ${url}`);
                throw error;
            }
            return games.filter( game => game.timestamp > searchUntilTimestamp );
        },
        getById : async ( { matchId, platformId = 'NA' } ) => {
            let url = '';
            try {
                url = `https://${CONSTS.SERVERS[platformId]}${CONSTS.baseURL}${CONSTS.match.getById}${matchId}`;
                const {
                    body
                } = await got(url, got_opts);
                return body;
            } catch (error) {
                if ( error.response && error.response.statusCode == 404 ) { throw CONSTS.ERRORS.SUMMONER_NOT_FOUND; }
                console.log(`Error on URL: ${url}`);
                throw error;
            }
        }
    },

    ERRORS  : CONSTS.ERRORS,
    SERVERS : CONSTS.SERVERS
};
