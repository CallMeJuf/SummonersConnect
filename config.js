let Config = {
    production : {
        Riot : {
            API_KEY : ''
        },
        Database : {
            host            : '',
            user            : '',
            dbName          : '',
            password        : '',
            connectionLimit : 50
        },
        WebServer : {
            port : 9999
        }
    },
    testing : {
        Riot : {
            API_KEY : ''
        },
        Database : {
            host            : '',
            user            : '',
            dbName          : '',
            password        : '',
            connectionLimit : 50
        },
        WebServer : {
            port : 9999
        }
    },
    development : {
        Riot : {
            API_KEY : ''
        },
        Database : {
            host            : '',
            user            : '',
            dbName          : '',
            password        : '',
            connectionLimit : 50
        },
        WebServer : {
            port : 9999
        }
    }
}
let environment = Object.keys(Config).includes(process.env.NODE_ENV) ? process.env.NODE_ENV : 'development';
module.exports = Config[environment];