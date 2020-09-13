const Migrations = [
    require('./createSummoner'),
    require('./createSummonerMatches'),
    require('./createSummonerQueue')
];

module.exports = {
    migrate : async () => {
        for ( let i in Migrations ){
            await Migrations[i].migrate();
        }
    }
};