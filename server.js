const Utils      = require('./utils/general');
const Database   = require('./database/database');
const Models     = Utils.getModels();
const Riot       = require('./utils/riot.js');
const Config     = require('./config.js');
const express    = require('express');
const bodyParser = require('body-parser');
const rateLimit  = require("express-rate-limit");
const app        = express();
const apiLimiter = rateLimit({
    windowMs : 120, // 1 second
    max      : 10
});

app.use(express.static('public'));
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(Config.WebServer.port, function () {
  console.log('Site started...');
});

app.get('/about', function (req, res) {
    res.render('about');
});

app.get('/api/:server/:summonerName1-:summonerName2', apiLimiter, async function (req, res){
    let ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    console.log(`${ip}: ${req.url}`);
    if ( !Riot.SERVERS.includes(req.params.server) ) { return res.end("Invalid server."); }

    let conn;
    let response = {
        matches       : [],
        summoner1Date : 0,
        summoner2Date : 0,
        error         : false,
        update        : true
    };
    let summoner1 = false;
    let summoner2 = false;

    let update_after_timestamp = Date.now() - 15 * 60 * 1000;
    if ( Utils.toSafeName(req.params.summonerName1) == Utils.toSafeName(req.params.summonerName2) ){
        response.error = "Summoners must be different";
        return res.json(response);
    }
    try {
        conn = await Database.pool.getConnection();
        await conn.beginTransaction();
        summoner1 = await Models.Summoner.getByName({ name: req.params.summonerName1, platformId: req.params.server });
        summoner2 = await Models.Summoner.getByName({ name: req.params.summonerName2, platformId: req.params.server });
        let summoner1Queue = await Models.SummonerQueue.find({ name: req.params.summonerName1, platformId: req.params.server });
        let summoner2Queue = await Models.SummonerQueue.find({ name: req.params.summonerName2, platformId: req.params.server });

        response.summoner1Date = summoner1 ? summoner1.processedAt : summoner1Queue ? summoner1Queue.created_at : response.summoner1Date;
        response.summoner2Date = summoner2 ? summoner2.processedAt : summoner2Queue ? summoner2Queue.created_at : response.summoner2Date;
        response.update = response.summoner1Date < update_after_timestamp || response.summoner2Date < update_after_timestamp;
        if ( summoner1 != false && summoner2 != false ){
            response.matches = await summoner1.getMatchListWithSummoner(summoner2);
        }
        await conn.commit();
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            conn.release();
        } //release to pool
    }

    if ( response.matches.length == 0 ){
        if ( !summoner1 || !summoner2 && !response.update ) { response.error = "Summoner not found."; }
        if ( !summoner1 || !summoner2 && response.update ) { response.error = "Summoner not found, try updating."; }
        if ( summoner1 && summoner2 && !response.update ) { response.error = "No shared matches found."; }
        if ( summoner1 && summoner2 && response.update ) { response.error = "No shared matches found, try updating."; }
    }


    response.matches = response.matches.map( set => {
        return {
            summoner1ChampId : set[0].champion,
            summoner2ChampId : set[1].champion,
            summoner1AccId   : 123,
            summoner2AccId   : 124,
            gameId           : set[0].gameId,
            gameType         : set[0].queue,
            timestamp        : set[0].timestamp
        };
    }).sort( (a, b) => b.timestamp - a.timestamp );

    return res.json(response);
});

app.get('/api/:server/:summonerName1-:summonerName2/update', apiLimiter, async function (req, res){
    let ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    console.log(`${ip}: ${req.url}`);

    if ( !Riot.SERVERS.includes(req.params.server) ) { return res.end("Invalid server."); }
    let conn;
    let update_after_timestamp = Date.now() - 15 * 60 * 1000;
    let updating = [];
    try {
        conn = await Database.pool.getConnection();
        await conn.beginTransaction();


        let summoner1 = await Models.SummonerQueue.find({ platformId: req.params.server, name: req.params.summonerName1, transactionConn: conn });
        let summoner2 = await Models.SummonerQueue.find({ platformId: req.params.server, name: req.params.summonerName2, transactionConn: conn });
        if ( !summoner1 || 
            ( 
             summoner1.created_at < update_after_timestamp && summoner1.processed_at < update_after_timestamp 
            )
           ){
            updating.push(req.params.summonerName1);
            await Models.SummonerQueue.create({ platformId: req.params.server, name: req.params.summonerName1, transactionConn: conn });
        }
        if ( !summoner2 || 
            ( 
             summoner2.created_at < update_after_timestamp && summoner2.processed_at < update_after_timestamp 
            )
           ){
            updating.push(req.params.summonerName2);
            await Models.SummonerQueue.create({ platformId: req.params.server, name: req.params.summonerName2, transactionConn: conn });
        }
        await conn.commit();
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            conn.release();
        } //release to pool
    }
    res.json(updating);
});

app.get('/api/:server/:summonerName1-:summonerName2/updating', apiLimiter, async function (req, res){
    let conn;
    let updating = '1';
    if ( !Riot.SERVERS.includes(req.params.server) ) { return res.end("Invalid server."); }

    try {
        conn = await Database.pool.getConnection();
        await conn.beginTransaction();
        let summoner1 = await Models.SummonerQueue.find({ platformId: req.params.server, name: req.params.summonerName1, transactionConn: conn });
        let summoner2 = await Models.SummonerQueue.find({ platformId: req.params.server, name: req.params.summonerName2, transactionConn: conn });
        if ( ( !summoner1 || summoner1.processed_status == 1 ) && ( !summoner2 || summoner2.processed_status == 1 ) ){
            updating = '0';
        }
        await conn.commit();
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            conn.release();
        } //release to pool
    }
    res.send(updating);
});

app.get('/:server/-', function (req, res) {
    res.render('index', { summoner1: null, summoner2: null });
  });
  
app.get('/json/*', function (req, res) {
res.status(400).send();
});
  
app.use(function(err, req, res, next) {
if (err instanceof URIError){
    console.log(err);
    return res.render('index', { summoner1: null, summoner2: null });
}
next();
});

app.get('*', function (req, res) {
    if ( req.url != '/' ){
        let ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
        console.log(`${ip}: ${req.url}`);
    }
    res.render('index');
});

app.get('/api/', apiLimiter);
