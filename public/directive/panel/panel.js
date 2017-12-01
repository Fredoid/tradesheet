angular.module('directive.panel', [])

.directive('panel', function () {
    return {
        restrict: "E",
        templateUrl: "directive/panel/panel.tmpl.html",
        transclude: true,
        scope: { title: '@'},
        controller: function($scope){}
        
    }
});
