var Promise      = require("promise");
var KrakenClient = require('kraken-api');

var key          = 'ieEuRyvsxl+4jKIpriMSzpAVS2Gob0ukgjiruxrQvoHaBF2vZu3wWG/G'; 
var secret       = 'ranXE3uKQy/vYX7fPqHOa/MZpiDl+y0be6LVIH+2ZtTvaEAXZHz+DVt/AsbCocU0c8CECUiiOmdbGK16np7OVQ=='; 
var kraken       = new KrakenClient(key, secret);

var defaultAPIGet = function(API, options, transformer){
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

module.exports = {
    deposit: {
        loadOnStart: true,
        provider: defaultAPIGet("Ledgers", {asset: 'all', type: "deposit"}, function(data){
            //for(var prop in data.ledger)
            //    if(data.ledger[prop].type != "deposit") delete data.ledger[prop];
            return data;
        }),
        interval: 150000,
        start: 2000
    },
    ticker: { 
        loadOnStart: true,
        provider: defaultAPIGet("Ticker", { pair : 'XXBTZEUR' }),
        interval: 10000,
        start: 0
    },
    tickers: { 
        loadOnStart: true,
        //provider: defaultAPIGet("Ticker", { pair : 'XBTEUR,BCHEUR,STREUR,XMREUR,LTCEUR,GNOEUR,XRPEUR,DASHEUR,ETCEUR,REPEUR,ETHEUR,ZECEUR' }),
        provider: defaultAPIGet("Ticker", { pair : 'XBTEUR,BCHEUR,XMREUR,LTCEUR,XRPEUR,DASHEUR,ETCEUR,REPEUR,ETHEUR,ZECEUR' }),
        interval: 10000,
        start: 5000
    },
    balance: {
        loadOnStart: true,
        provider: defaultAPIGet("Balance"),
        interval: 120000,
        start: 1000
    },
    openOrders: {
        loadOnStart: true,
        provider: defaultAPIGet("OpenOrders"),
        interval: 130000,
        start: 7000
    },
    closedOrders: {
        loadOnStart: true,
        provider: defaultAPIGet("ClosedOrders"),
        interval: 140000,
        start: 5000
    }
};