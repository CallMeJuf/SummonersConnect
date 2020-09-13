'use strict';
const Database   = require('./database/database');
const Migrations = require('./database/migrate');
const Utils      = require('./utils/general');
const Models     = Utils.getModels();
const Riot       = require('./utils/riot');

async function main() {
  await Migrations.migrate();
  while (true) { // eslint-disable-line
    let queue = await Models.SummonerQueue.getTopQueue({ limit: 5 });
    await Promise.all(queue.map( row => processQueueEntry(row)));
    if (queue.length == 0) {
      await Utils.sleep(200);
    }
  }
};

async function processQueueEntry(row){
  let conn;
  try {
    conn = await Database.pool.getConnection();
    await conn.beginTransaction();
    Utils.log(`Getting summoner (${row.name}) from Riot.`);
    let summoner = await row.getSummonerFromRiot();
    Utils.log(`Getting summoner (${summoner.name}) matchlist from Riot.`);
    await summoner.getMatchListFromRiot();
    Utils.log(`Saving summoner (${summoner.name}).`);
    summoner.processedAt = Date.now();
    await summoner.save(conn, { eager: true });
    row.puuid = summoner.puuid;
    await row.finish(conn);
    Utils.log(`Committing summoner (${summoner.name}).`);
    await conn.commit();
    Utils.log(`Done summoner (${summoner.name}).`);

  } catch (err) {
    if (err == Riot.ERRORS.SUMMONER_NOT_FOUND || err == Riot.ERRORS.MATCHLIST_NOT_FOUND) {
      Utils.log(`Warning: ${err.message} (Name: ${row.name}, platformId: ${row.platformId})`);
      await row.finish(conn);
      await conn.commit();
    } else {
      throw err;
    }
  } finally {
    if (conn) {
      conn.release();
    } //release to pool
  }
  return;
}

main().catch(a => {
  console.log(a);
  process.exit(1);
});
