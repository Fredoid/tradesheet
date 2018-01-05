angular.module('app', [
    'ui.router',
    'app.home',
    'app.compare',
    'app.watcher',
    'directive',
    "service.sync",
    "service.currencies"
])

    .config(function ($sceDelegateProvider, $stateProvider, $urlRouterProvider) {

        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            'http://trade.kraken.com/**'
          ]);


        $stateProvider
            .state('app', {
                url: '/',
                templateUrl: 'app/app.tmpl.html',
                controller: 'AppCtrl'
            });

        $urlRouterProvider.otherwise('/home/');
    })

    .controller('AppCtrl', function ($scope, $templateCache, $state, $rootScope, $window, SyncService, CurrenciesService) {
        SyncService.on("info", function(info){
            console.log("> Server Info:", info);
        });
    })
.filter('percentage', ['$filter', function ($filter) {
  return function (input, decimals) {
    return $filter('number')(input * 100, decimals) + ' %';
  };
}]);;