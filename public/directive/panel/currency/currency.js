angular.module('directive.panel.currency', [])

.directive('panelCurrency', function () {
    return {
        restrict: "E",
        templateUrl: "directive/panel/currency/currency.tmpl.html",
        scope: {
            value: '=',
            subvalue: '=',
            title: '@',
            icon: '@',
            currentTicker: '=',
            previousTicker: '='
        },
        controller: function($scope){}
        
    }
});
