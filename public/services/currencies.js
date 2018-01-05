angular.module('service.currencies', [])

.factory('CurrenciesService', function ($window) {
    var service = {
        formatFromBalance: function(currency){
            if(currency == "XXLM") return "XXLMXXBT";
            if(currency == "XICN") return "XICNXXBT";
            return currency + (currency[0] == "X" ? "ZEUR" : "EUR");
            
        },
        formatFromOrder: function(currency){
            if(currency == "XLMXBT") return "XXLMXXBT";
            if(currency == "ICNXBT") return "XICNXXBT";
            return currency == "DASHEUR" | currency == "BCHEUR"  ? currency : "X" + currency[0] + currency[1] + currency[2] + "ZEUR";
        },
        
        formatTitleFromPair: function(pair){
            var v = pair.replace("ZEUR", "").replace("EUR", "");
            if(pair == "XXLMXXBT") return "XLM";
            if(pair == "XICNXXBT") return "ICN";
            return v[0] == "X" ? v.substring(1) : v;
        },
        
        formatBalanceFromPair: function(pair){
            if(pair == "XXLMXXBT") return "XXLM";
            if(pair == "XICNXBT") return "XICN";
            return pair.replace("ZEUR", "");
        },
        
        pretifyPair: function(pair){
            var v = pair.replace("ZEUR", "").replace("EUR", "");
            if(pair == "XXLMXXBT") return "STRBTC";
            if(pair == "XICNXXBT") return "ICNBTC";
            return (v[0] == "X" ? v.substring(1) : v).replace("XBT", "BTC") + "EUR";
        },
        
        pretifyPairXBT: function(pair){
            var v = pair.replace("ZEUR", "").replace("EUR", "");
            if(pair == "XXLMXXBT") return "XLMXBT";
            if(pair == "XICNXXBT") return "ICNXBT";
            return (v[0] == "X" ? v.substring(1) : v) + "EUR";
        },
        
        buyCurrency: function(pair){
            
        },
        
        withCurrency: function(pair){
            
        },
        
        ask: function(tick){
            return tick.a[0];
        },
        
        bid: function(tick){
            return tick.b[0];
        },
        
        price: function(tick){
            return service.bid(tick);
        },
        
        open: function(tick){
            return tick.o;
        }
    }
    return service; 
});