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
    
        
        $scope.lastRefreshedDate = new Date();
        $scope.rawBalance = null;
        $scope.balance = {};
        $scope.balanceTotal = 0.0;
        $scope.ticker= null;
        $scope.deposit = null;
        $scope.totalDeposite = 0;
        $scope.openOrders = [];
        $scope.closedOrders = [];
        $scope.tickers = [];
        
        this.processingLock = false;
    
        
        SyncService.on("tickers", function(tickers){
            $scope.ticker = tickers;
            $scope.tickers = [];
            $scope.lastRefreshedDate = tickers.date;
            for(var prop in tickers){
                if(prop == "date") continue;
                tickers[prop].label = prop;
                tickers[prop].rate = (tickers[prop].b[0] * 100 / tickers[prop].o) / 100; 
                $scope.tickers.push(tickers[prop])
            }
            $scope.$apply();
            
            updateBalance();
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
            console.log("closed orders", data);
            var tmp = [];
            for(var prop in data.closed){
                data.closed[prop].date = new Date(data.closed[prop].opentm*1000)
                data.closed[prop].id = prop;
                tmp.push(data.closed[prop]);
            }
            $scope.closedOrders = tmp;
            $scope.$apply();
        })
    
        SyncService.on('balance', function(data){
            refreshBalance(data);
            updateBalance();
        });
    
        SyncService.on('deposit', function(deposit){
            $scope.deposite = deposit;
            $scope.totalDeposite = 0;
            for(var prop in deposit.ledger)
                $scope.totalDeposite += parseFloat(deposit.ledger[prop].amount);
            $scope.$apply();
        });
    
        var refreshTicker = function(ticker){
            $scope.lastRefreshedDate = ticker.date;
            $scope.ticker = ticker;
            $scope.$apply();
        }
        
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
                for(var prop in $scope.rawBalance){
                    if(prop[0] == "$" || prop == "toJSON" || prop == "date") continue;
                    var tickerName = CurrenciesService.formatFromBalance(prop);
                    tt = parseFloat($scope.rawBalance[prop]);
                    t = prop == "ZEUR" ? tt : tt * $scope.ticker[tickerName].b[0];
                    $scope.balance[prop] = { 
                        currency : prop,
                        value : tt,
                        valueeuro : t,
                        ticker : $scope.ticker[tickerName]
                    };
                    if($scope.ticker[tickerName])
                        $scope.ticker[tickerName].balance = $scope.balance[prop];
                    $scope.balanceTotal = $scope.balanceTotal + t;
                }  
                self.processingLock = false;
                $scope.$apply();
            }
            if($scope.ticker == null)
                return SyncService.last('tickers', function(ticker){
                    refreshTicker(ticker);
                    update();
                })
            
            else if($scope.rawBalance == null)
                return SyncService.last('balance', function(balance){
                    refreshBalance(balance);
                    update();
                })
            else 
                update();
        }
    })
         
    .filter('mainTickers', function () {
      return function (items) {
        return items.filter(function(item){
            return typeof item.balance != "undefined";
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
    });