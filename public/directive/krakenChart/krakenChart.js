angular.module('directive.krakenChart', [])

.directive('krakenChart', function () {
    return {
        restrict: "E",
        templateUrl: "directive/krakenChart/krakenChart.tmpl.html",
        scope: {
            pair: '=',
            duration: '='
        },
        controller: function($scope, $window){
            $scope.$window = $window;
        }
    }
});
