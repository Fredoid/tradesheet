angular.module('directive.panel.order', [
    "service.api",
    "service.sync",
    "service.currencies",
])

.directive('panelOrder', function () {
    return {
        restrict: "E",
        templateUrl: "directive/panel/order/order.tmpl.html",
        scope: {
        },
        controller: function($scope, APIAddOrder, SyncService, $filter, CurrenciesService){
            
            console.log("Order Panel");
            $scope.currenciesService = CurrenciesService;
            $scope.order = {
                pair: 'none',
                type: 'buy',
                ordertype: '', 
                price: 0,
                volume: 0
            };    
            
            $scope.sellOrders = [];
            $scope.buyOrders = [];
            $scope.previousSellOrder = {};
            $scope.previousBuyOrder = {};
            $scope.ticker = null;
            $scope.tickers = [];
            
            
            
            var updateOrders = function(data){
                $scope.sellOrders = [];
                $scope.buyOrders = [];
                for(var prop in data.closed){
                    if(data.closed[prop].status != "closed") continue;
                    if(data.closed[prop].descr.type == "sell") $scope.sellOrders.push(data.closed[prop]);
                    else if(data.closed[prop].descr.type == "buy") $scope.buyOrders.push(data.closed[prop]);
                    data.closed[prop].id = prop;
                    data.closed[prop].pair = data.closed[prop].descr.pair;
                    data.closed[prop].label = 
                        data.closed[prop].pair
                        + " - " + $filter('number')(data.closed[prop].price) 
                        + " - " + $filter('number')(data.closed[prop].vol)
                        + " - " + $filter('currency')(data.closed[prop].cost)
                    console.log("Add order " + data.closed[prop].descr.type);
                }
                
            }
            
            
            
            $scope.$watch($scope.order.pair, function(){
                console.log("order pair changed", arguments);
            })
            
            $scope.$watch($scope.previousSellOrder, function(){
                console.log("previousSellOrder", arguments);
            })
            
            $scope.$watch($scope.previousBuyOrder, function(){
                console.log("previousBuyOrder", arguments);
            })
            
            /**
                TICKERS
            ***/
            
            var updateTicker = function(ticker){
                $scope.ticker = ticker;
                $scope.tickers = [];
                for(var prop in ticker){
                    if(prop == "date") continue;
                    ticker[prop].label = prop;
                    ticker[prop].id = prop;
                    $scope.tickers.push($scope.ticker[prop]);
                }
            }
            
            // Sync Service
            SyncService.on('closedOrders', updateOrders);
            SyncService.on('tickers', updateTicker);
            
        }
    }
});
