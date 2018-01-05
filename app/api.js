var Promise      = require("promise");
var KrakenClient = require('kraken-api');
var modelWatch = require("../config/es_models/watch");
var ESClient = require("./elasticsearch-client");
//var es = es_mock;
var es = new ESClient(modelWatch);

// user api for Ticker
var krakens = {};
var kraken_user = {
    ticker: {
        key: 'XE7ALs5daCBcwqCPhgqkZyikgMdOVzRAr7eQKI4/Abbb1ohQx3/rAyKB',
        secret: 'U9J4ca1kjGOfuK6YlfWWugJdeNSJFCFIYm3mVvzeFwloZPZM/KpT/CfUdR0O/I27Ubq4XnuxlTv571Pu0EcZrA=='
    },
    order: {
        key: 's+iBaapcwUd20nXqAVR36CyZNImfc/Vy9FkVduLcGW7juCLERS1A7Mfi',
        secret: 'hMJtFfhRlovQvUZH9sE2hmxmeUjSquoqQQwdOPHw1SmraKecL20y5fxZyko0NX09p9dxokPtgZLuDdVWZt/SIA=='
    },
    balance: {
        key: 'v+uJPDlbUHgzvUGSExEkIU42VC9xb89QcitIUnT4azsmBeQdIdlbvjcE',
        secret: '5+nr4yPFB+IDwjVmtTriDTbeFaWeil/hSoX6GbvCS6NRL+p+pQZ3RvTTJ7MFNzJePczReGkOaQ6CXJX40tYTYQ=='
    },
    ledger: {
        key: 'PW8ziLbBmQyezswMi+eo4n4LIR/Efr8b3oxlptmaZT2152up2zhxHjq8',
        secret: '3dklQvhzsev7zcbeglAAuP5sMCbdgaQV3ftKb+R6RQsECDJFPMUV6pnuI7wh1sHkt7nMdD6q5xVmr6PoGApq+g=='
    },
    trade: {
        key: 'yBAllp+GR7VX+APlUjZBODrxjhKe7cAInPzvYZ0LQlYvnWT3NnmWGHs5',
        secret: '/zc87IfRmpDYm7e/d13S3WAzUMIPBOXfhjE4lxJN6zzba5RGQm8WgRgcyoammTUz8NKYLFJAXdEAO7cZ+QMKXQ=='
    }
    
}

for(var prop in kraken_user)
    krakens[prop] = new KrakenClient(kraken_user[prop].key, kraken_user[prop].secret);

var defaultAPIGet = function(kraken, API, options, transformer){
    return function(params){
        var p = typeof params != "optionsd" && params != null
                ? params 
                : typeof options != "undefined" && options != null
                    ? options
                    : {};
        return new Promise(function (resolve, reject) {
          kraken.api(API, p).then(function(data){
                if(data.error.length > 0 ) return reject(data.error[0]);
                resolve(typeof transformer == "function" ? transformer(data.result) : data.result);
            }, reject).catch(reject);
        });
    };
}

es.init().then(function(){
    console.log("es initiliasized");
}, function(err){
    console.log("Cannot initialize ES", err);
})


var listWatchers = function(params, query){
    var to = Date.now(), from = to - (params.age || (query && query.age ? query.age : 60)*60*1000);
    // q date >= "2018-01-01T20:03:33.464Z" AND date <= "2018-01-01T21:03:33.464Z"
    return new Promise(function(resolve, reject){
        var p = {
            size: params.size || 1000,
            sort: [
                "timestamp"
            ],
            body: {
                query: {
                    range : {
                        timestamp : {
                            gte: from,
                            lte: to
                        }
                    }
                }
            }
        };
        es.search(p).then(function(watchers) {
            var rs = [];
            for(var i = 0 ; i < watchers.hits.hits.length; ++i)
                rs.push(watchers.hits.hits[i]._source);
            return resolve(rs);
        }, function(err){
            reject(err);
        });
    }, function(err){ console.log("watchers service error", err) });
}


var updateWatcher = function(watcher){
    return new Promise(function(resolve, reject){
        es.updateOrIndex(watcher).then(function(data){
            resolve(watcher);    
        }, function(err){ console.log("watchers service error", err) });
    }, function(err){ console.log("watchers service error", err) });
}

module.exports = {
    deposit: {
        handler: ['stream'],
        loadOnStart: true,
        provider: defaultAPIGet(krakens["ledger"], "Ledgers", {asset: 'all', type: "deposit"}, function(data){
            //for(var prop in data.ledger)
            //    if(data.ledger[prop].type != "deposit") delete data.ledger[prop];
            return data;
        }),
        interval: 150000,
        start: 2000
    },
    /*
    ticker: { 
        handler: ['stream', 'http'],
        loadOnStart: true,
        provider: defaultAPIGet("Ticker", { pair : 'XXBTZEUR' }),
        interval: 10000,
        start: 0
    },
    */
    tickers: { 
        handler: ['stream', 'http'],
        loadOnStart: true,
        provider: defaultAPIGet(krakens["ticker"], "Ticker", { pair : 'XBTEUR,BCHEUR,XMREUR,LTCEUR,XRPEUR,DASHEUR,ETCEUR,REPEUR,ETHEUR,ZECEUR,XLMXBT,ICNXBT' }),
        interval: 10000,
        start: 0
    },
    balance: {
        handler: ['stream'],
        loadOnStart: true,
        provider: defaultAPIGet(krakens["balance"], "Balance"),
        interval: 120000,
        start: 1000
    },
    openOrders: {
        handler: ['stream'],
        loadOnStart: true,
        provider: defaultAPIGet(krakens["order"], "OpenOrders"),
        interval: 130000,
        start: 7000
    },
    closedOrders: {
        handler: ['stream'],
        loadOnStart: true,
        provider: defaultAPIGet(krakens["order"], "ClosedOrders"),
        interval: 140000,
        start: 5000
    },
    
    addOrder: {
        handler: ['http'],
        provider: defaultAPIGet(krakens["trade"], "AddOrder"),
        method: "post"
    },
    
    watchers: {
        handler: ["http"],
        providers: {
            get: listWatchers,
            post: updateWatcher
        }
    }
};