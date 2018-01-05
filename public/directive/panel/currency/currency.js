angular.module('directive.panel.currency', [])

.directive('panelCurrency', function () {
    return {
        restrict: "E",
        templateUrl: "directive/panel/currency/currency.tmpl.html",
        scope: {
            value: '=',
            hideValue: '=',
            previousValue: '=',
            subvalue: '=',
            title: '@',
            icon: '@',
            currentTicker: '=',
            currentTickerBase: '=',
            previousTicker: '=',
            xl: '=',
            enableGain: '=',
            lastBotRate: '=',
            lastBotRatio: '=',
            nbDecimal: '='
        },
        controller: function($scope){
            var update = function(){
                $scope.Now = new Date();
                setTimeout(update, 10000);
            }
            update();
        }
    }
})
.filter('singleDecimal', function ($filter) {
    return function (input) {
        if (isNaN(input)) return input;
        return Math.round(input * 10) / 10;
    };
})

.filter('setDecimal', function ($filter) {
    return function (input, places) {
        if (isNaN(input)) return input;
        // If we want 1 decimal place, we want to mult/div by 10
        // If we want 2 decimal places, we want to mult/div by 100, etc
        // So use the following to create that factor
        var factor = "1" + Array(+(places > 0 && places + 1)).join("0");
        var input = Math.round(input * factor) / factor;
        var split = (''+input).split(".");
        if(split[0] >= 1000) split[0] = split[0].substring(0, split[0].length-3) + " " + split[0].substring(split[0].length-3);
        return split.join(",");
    };
});
