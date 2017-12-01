angular.module('app', [
    'ui.router',
    'app.home',
    'app.compare',
    'directive',
    "service.sync",
    "service.currencies"
])

    .config(function ($sceDelegateProvider, $stateProvider, $urlRouterProvider) {

        $sceDelegateProvider.resourceUrlWhitelist([
            'self'
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
        
    })
.filter('percentage', ['$filter', function ($filter) {
  return function (input, decimals) {
    return $filter('number')(input * 100, decimals) + ' %';
  };
}]);;