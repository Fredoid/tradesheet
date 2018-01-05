angular.module('app.home', [
    "service.sync",
    "service.currencies",
])
    .config(function ($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('app.home', {
                url: 'home/',
                views: {
                    'AppPanel@app': {
                        templateUrl: 'app/home/home.tmpl.html',
                        controller: 'HomeCtrl'
                    }
                }
            });
    })

    .controller('HomeCtrl', function SchemaDefinitionCtrl($scope, $state, $window, $q, SyncService, CurrenciesService) {
        var self = this;    
        $scope.$state = $state;
        $scope.$window = $window;
        $scope.currenciesService = CurrenciesService;
    
        
        $scope.rawBalance = null;
        $scope.balance = {};
        $scope.balanceTotal = 0.0;
        $scope.balanceTotalXBT = 0.0;
        $scope.balanceTotalAltcoin = 0.0;
        $scope.ticker= null;
        $scope.deposit = null;
        $scope.totalDeposite = 0;
        $scope.openOrders = [];
        $scope.closedOrders = [];
        $scope.tickers = [];
        $scope.chartPair = "BTCEUR";
        $scope.chartDuration = "1d";
        $scope.equity = {}; 
        $scope.botData = [];
    
        this.processingLock = false;
    
        $scope.tickerClick = function(tick){
            $scope.chartPair = CurrenciesService.pretifyPair(tick.label)
            for(var prop in $scope.ticker)
                $scope.ticker[prop].selected = false;
            tick.selected = true;
        }
        
        var onTickers = function(tickers){
            if($scope.ticker == null)
                $scope.ticker = tickers;
            else{ 
                for(var prop in tickers){
                    tickers[prop].selected = $scope.ticker[prop] ? $scope.ticker[prop].selected : false;
                    tickers[prop].bot_order = $scope.ticker[prop] ? $scope.ticker[prop].bot_order : 9999;
                    tickers[prop].bot_ratio = $scope.ticker[prop] ? $scope.ticker[prop].bot_ratio : 0;
                    tickers[prop].bot_last_top = $scope.ticker[prop].bot_last_top;
                }
                $scope.ticker = tickers;
            }

            $scope.tickers = [];
            for(var prop in $scope.ticker){
                if(prop == "date") continue;
                $scope.ticker[prop].label = prop;
                $scope.ticker[prop].rate = 
                    ((CurrenciesService.price($scope.ticker[prop]) * 100 / CurrenciesService.open($scope.ticker[prop])) / 100) - 1; 
                $scope.tickers.push($scope.ticker[prop])
            }
            $scope.$apply();
            
            updateBalance();
        }
        SyncService.on("tickers", onTickers);
        
        SyncService.on("bot-data", function(data){
            $scope.botData = data;
            var total_ratio = 0.0;
            var i = 0;
            for(var prop in $scope.ticker){
                if(prop == "date") continue;
                if(data[prop] && data[prop].order != $scope.ticker[prop].bot_order)
                    $scope.ticker[prop].bot_last_top =  { rate: $scope.ticker[prop].rate, date: new Date() };
                
                $scope.ticker[prop].bot_order = data[prop] ? data[prop].order : 9000 + i;
                $scope.ticker[prop].bot_ratio = parseFloat(data[prop] ? data[prop].ratio : 0);
                
                total_ratio += $scope.ticker[prop].bot_ratio;
                
                ++i;
            }
            
            console.log("bot-data, tickers", $scope.ticker);
            console.log("bot-data, total_ratio", total_ratio);
            $scope.$apply();
        });
    
        SyncService.on("openOrders", function(data){
            var tmp = [];
            for(var prop in data.open){
                
                data.open[prop].date = new Date(data.open[prop].opentm*1000)
                data.open[prop].id = prop;
                tmp.push(data.open[prop]);
            }
            $scope.openOrders = tmp;
            $scope.$apply();
        })
    
        SyncService.on("closedOrders", function(data){
            var tmp = [];
            for(var prop in data.closed){
                data.closed[prop].date = new Date(data.closed[prop].closetm*1000)
                data.closed[prop].id = prop;
                tmp.push(data.closed[prop]);
            }
            
            tmp.sort(function(a, b){
                if(a.closetm < b.closetm)   return -1;
                else if(a.closetm > b.closetm) return 1;
                else return 0;
            });

            var equity = {};
            for(var i = 0 ; i < tmp.length ; ++i){
                if(!equity[tmp[i].descr.pair])
                    equity[tmp[i].descr.pair] = { amount: 0, spent: 0, buy: 0, sell: 0 };
                
                if(tmp[i].descr.type == "buy"){
                    equity[tmp[i].descr.pair].amount += parseFloat(tmp[i].vol);
                    equity[tmp[i].descr.pair].spent += realCost(tmp[i].descr.pair, parseFloat(tmp[i].cost));
                    equity[tmp[i].descr.pair].buy += realCost(tmp[i].descr.pair, parseFloat(tmp[i].cost));
                }
                else if(tmp[i].descr.type == "sell"){
                    equity[tmp[i].descr.pair].amount -= parseFloat(tmp[i].vol);
                    equity[tmp[i].descr.pair].spent -= realCost(tmp[i].descr.pair, parseFloat(tmp[i].cost));
                    equity[tmp[i].descr.pair].sell += realCost(tmp[i].descr.pair, parseFloat(tmp[i].cost));
                }
            }
            console.log("Equity:");
            console.log(equity);
            $scope.equity = equity;
            $scope.closedOrders = tmp;            
        })
    
        var onBalance = function(data){
            refreshBalance(data);
            updateBalance();
        };
        SyncService.on('balance', onBalance);
    
        SyncService.on('deposit', function(deposit){
            $scope.deposite = deposit;
            $scope.totalDeposite = 0;
            for(var prop in deposit.ledger)
                $scope.totalDeposite += parseFloat(deposit.ledger[prop].amount);
            $scope.$apply();
        });
    
        var refreshBalance = function(balance){
            $scope.rawBalance = balance;
            $scope.$apply();
        }
        
        var updateBalance = function(){
            var update = function(){
                
                if(self.processingLock) return;
                self.processingLock = true;
                
                $scope.balance = {};
                $scope.balanceTotal = 0.0;
                
                var t, tt;
                $scope.balanceTotalAltcoin = 0.0;
                $scope.balanceTotalXBT = 0.0;
                for(var prop in $scope.rawBalance){
                    if(prop[0] == "$" || prop == "toJSON" || prop == "date") continue;
                    var tickerName = CurrenciesService.formatFromBalance(prop);
                    tt = parseFloat($scope.rawBalance[prop]);
                    var price = 1;
                    if(prop == "XXLM" || prop == "XICN")
                        price = CurrenciesService.price($scope.ticker["XXBTZEUR"]) * CurrenciesService.price($scope.ticker[tickerName])
                    else if(prop != "ZEUR")
                        price = CurrenciesService.price($scope.ticker[tickerName]);
                    t =  tt * price;
                    $scope.balance[prop] = { 
                        currency : prop,
                        value : tt,
                        valueeuro : t,
                        ticker : $scope.ticker[tickerName]
                    };
                    
                    if(prop == "XXBT")
                        $scope.balanceTotalXBT += $scope.balance[prop].valueeuro;
                    else if(prop != "ZEUR"){
                        $scope.balanceTotalAltcoin += $scope.balance[prop].valueeuro;
                    }
                    
                    if($scope.ticker[tickerName] && tt > 0)
                        $scope.ticker[tickerName].balance = $scope.balance[prop];
                    $scope.balanceTotal = $scope.balanceTotal + t;
                }  
                self.processingLock = false;
                $scope.$apply();
            }
            if($scope.ticker == null)
                return SyncService.last('tickers', onTickers)
            
            else if($scope.rawBalance == null)
                return SyncService.last('balance', onBalance);
            else 
                update();
        }
        
        var realCost = function(pair, cost){
            var currencies = [];
            for(var prop in $scope.balance)
                currencies.push(["X", "Z"].indexOf(prop[0]) > -1 ? prop.substring(1) : prop);
            var r = "("+ currencies.join('|') +")("+ currencies.join('|') +")";
            
            var reg = new RegExp(r);
            var match = pair.match(reg);
            
            var buyCurrency = match[1];
            var withCurrency = match[2];
            
            
            if(withCurrency == "EUR") 
                return cost;
            var tickerName = ["BCH","DASH"].indexOf(withCurrency) > -1 
                ? withCurrency+"EUR"
                : "X" + withCurrency + "ZEUR";
            
            if($scope.ticker[tickerName])
                return cost * $scope.ticker[tickerName].b[0];
            
            return cost;
        }
        $scope.realCost = realCost;
       
        
    })
         
    .filter('mainTickers', function () {
      return function (items) {
          return items;
        return items.filter(function(item){
            return typeof item.balance != "undefined";
        }).sort(function(a, b){
            if(a.balance && !b.balance) return 1;
            else if(!a.balance && b.balance) return -1;
            else if(a.balance.valueeuro > b.balance.valueeuro) return 1;
            else if(a.balance.valueeuro < b.balance.valueeuro) return -1;
            else return 0;
        });
      };
    })
    .filter('otherTickers', function () {
      return function (items) {
        return items.filter(function(item){
            return typeof item.balance == "undefined";
        });
      };
    })
               
    .filter('closedOrders', function () {
      return function (items) {
        return items.filter(function(item){
            return item.status == "closed";
        }).sort(function(a, b){
            if(a.closetm > b.closetm) return -1;
            else if (a.closetm < b.closetm) return 1;
            else return 0;
        });
      };
    })
    .filter('tickerOrder', function() {
         return function(items) {  
             var rs = [];
             for(var i = 0; i < items.length; ++i)
                 rs[i] = items[i];
             
            rs.sort(function(a,b){   
                if ((a.balance && b.balance && a.balance.valueeuro > b.balance.valueeuro)
                        || (a.balance && !b.balance))
                    return 1;
                if ((a.balance && b.balance && a.balance.valueeuro < b.balance.valueeuro)
                    || (b.balance && !a.balance))
                    return -1;         
                return 0; 
            });
             rs.reverse();
             return rs;
        }
    })
    .filter('duration', function() {
        var DURATION_FORMATS_SPLIT = /((?:[^ydhms']+)|(?:'(?:[^']|'')*')|(?:y+|d+|h+|m+|s+))(.*)/;
        var DURATION_FORMATS = {
          y: { // years
            // "longer" years are not supported
            value: 365 * 24 * 60 * 60 * 1000,
          },
          yy: {
            value: 'y',
            pad: 2,
          },
          d: { // days
            value: 24 * 60 * 60 * 1000,
          },
          dd: {
            value: 'd',
            pad: 2,
          },
          h: { // hours
            value: 60 * 60 * 1000,
          },
          hh: { // padded hours
            value: 'h',
            pad: 2,
          },
          m: { // minutes
            value: 60 * 1000,
          },
          mm: { // padded minutes
            value: 'm',
            pad: 2,
          },
          s: { // seconds
            value: 1000,
          },
          ss: { // padded seconds
            value: 's',
            pad: 2,
          },
          sss: { // milliseconds
            value: 1,
          },
          ssss: { // padded milliseconds
            value: 'sss',
            pad: 4,
          },
        };

        function _parseFormat(string) {
          // @inspiration AngularJS date filter
          var parts = [];
          var format = string ? string.toString() : '';

          while (format) {
            var match = DURATION_FORMATS_SPLIT.exec(format);

            if (match) {
              parts = parts.concat(match.slice(1));

              format = parts.pop();
            } else {
              parts.push(format);

              format = null;
            }
          }

          return parts;
        }

        function _formatDuration(timestamp, format) {
          var text = '';
          var values = { };

          format.filter(function(format) { // filter only value parts of format
            return DURATION_FORMATS.hasOwnProperty(format);
          }).map(function(format) { // get formats with values only
            var config = DURATION_FORMATS[format];

            if (config.hasOwnProperty('pad')) {
              return config.value;
            } else {
              return format;
            }
          }).filter(function(format, index, arr) { // remove duplicates
            return (arr.indexOf(format) === index);
          }).map(function(format) { // get format configurations with values
            return angular.extend({
              name: format,
            }, DURATION_FORMATS[format]);
          }).sort(function(a, b) { // sort formats descending by value
            return b.value - a.value;
          }).forEach(function(format) { // create values for format parts
            var value = values[format.name] = Math.floor(timestamp / format.value);

            timestamp = timestamp - (value * format.value);
          });

          format.forEach(function(part) {
            var format = DURATION_FORMATS[part];

            if (format) {
              var value = values[format.value];

              text += (format.hasOwnProperty('pad') ? _padNumber(value, Math.max(format.pad, value.toString().length)) : values[part]);
            } else {
              text += part.replace(/(^'|'$)/g, '').replace(/''/g, '\'');
            }
          });

          return text;
        }

        function _padNumber(number, len) {
          return ((new Array(len + 1)).join('0') + number).slice(-len);
        }

        return function(value, format) {
          var parsedValue = parseFloat(value, 10);
          var parsedFormat = _parseFormat(format);

          if (isNaN(parsedValue) || (parsedFormat.length === 0)) {
            return value;
          } else {
            return _formatDuration(parsedValue, parsedFormat);
          }
        };
      });