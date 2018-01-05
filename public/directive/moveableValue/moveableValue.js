angular.module('directive.moveableValue', [])

.directive('moveableValue', function () {
    return {
        restrict: "E",
        templateUrl: "directive/moveableValue/moveableValue.tmpl.html",
        transclude: true,
        scope: {
            current: '=',
            previous: '=',
            enableColor: '='
        },
        controller: function($scope, $window){
            $scope.state = 0;
            $scope.rate = 0;
            var refreshState = function(){
                if($scope.previous == null || $scope.current == null) return;                
                var p = $window.parseFloat($scope.previous)
                , c = $window.parseFloat($scope.current)
                $scope.state = c > p ? 1 : c < p ? -1 : 0;
                
                var diff = c - p;
                $scope.rate = diff * 100 / p;
            }
            
            $scope.$watch("current", refreshState);
            $scope.$watch("previous", refreshState);
        }
        
    }
});
