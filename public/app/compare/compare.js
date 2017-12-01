angular.module('app.compare', [
    "service.sync",
    "service.currencies",
])
    .config(function ($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('app.compare', {
                url: 'compare/',
                views: {
                    'AppPanel@app': {
                        templateUrl: 'app/compare/compare.tmpl.html',
                        controller: 'CompareCtrl'
                    }
                }
            });
    })

    .controller('CompareCtrl', function SchemaDefinitionCtrl($scope, $state, $window, $q, SyncService, CurrenciesService) {
        $scope.$state = $state;
        $scope.$window = $window;
        $scope.currenciesService = CurrenciesService;
    
        $scope.tickers = [];
        $scope.lastRefreshedDate = null;
        
    
        SyncService.on("tickers", function(data){
            $scope.tickers = [];
            $scope.lastRefreshedDate = data.date;
            for(var prop in data){
                if(prop == "date") continue;
                data[prop].label = prop;
                $scope.tickers.push(data[prop])
            }
            
            $scope.$apply();
        });
    
    });