angular.module('service.currencies', [])

.factory('CurrenciesService', function ($window) {
    return {
        formatFromBalance: function(currency){
            return currency + (currency[0] == "X" ? "ZEUR" : "EUR");
            
        },
        formatFromOrder: function(currency){
            return "X" + currency[0] + currency[1] + currency[2] + "ZEUR";
            
        },
        
        formatTitleFromPair(pair){
            var v = pair.replace("ZEUR", "").replace("EUR", "");
            return v[0] == "X" ? v.substring(1) : v;
        },
        
        formatBalanceFromPair(pair){
            return pair.replace("ZEUR", "");
        }
    }
});