angular.module('app.watcher', [
    "service.api",
    "service.sync"
])
    .config(function ($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('app.watcher', {
                url: 'watcher/',
                views: {
                    'AppPanel@app': {
                        templateUrl: 'app/watcher/watcher.tmpl.html',
                        controller: 'WatcherCtrl'
                    }
                }
            });
    })

    .controller('WatcherCtrl', function ($scope, $state, $window, $q, APIWatcher, SyncService) {
        $scope.$state = $state;
        $scope.$window = $window;
        $scope.field = "_ask_price"; 
        $scope.currencies = ["BCHEUR",
                                "DASHEUR",
                                "XETCZEUR",
                                "XETHZEUR",
                                "XLTCZEUR",
                                "XREPZEUR",
                                "XXBTZEUR",
                                "XXMRZEUR",
                                "XXRPZEUR",
                                "XZECZEUR"];
        $scope.currency = "XXRPZEUR";
        $scope.selectedWatch = {};
        $scope.showForm = false;
        $scope.age = 15;
        $scope.ages = [0.25*60, 0.5*60, 1*60, 2*60, 6*60, 12*60, 24*60];
        
        $scope.setWatcherPerf = function(watcher, perf){
            watcher[$scope.currency + "_perf"] = perf;
            watcher.$save();
        }
        var lastData = watchers;
        var d3 = $window.d3;
        var svg = d3.select("svg"),
            margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = +$($window).width() - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom;
        svg.attr("width", $($window).width()-20);
        var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
            y = d3.scaleLinear().rangeRound([height, 0]);
        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
        var line = d3.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d[$scope.currency+$scope.field]); })
            
        
    
        var drawChart = function(){
                var data= watchers;
                x.domain(data.map(function(d) { return d.date; }));
                y.domain([d3.min(data, function(d) { return d[$scope.currency+$scope.field]; }), d3.max(data,   function(d) { return d[$scope.currency+$scope.field]; })]);
                
                g.selectAll(".axis").remove();
                g.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));

                g.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3.axisLeft(y).ticks(10, ""))
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", "0.71em")
                    .attr("text-anchor", "end")
                    .text("Frequency");
            
                g.selectAll("path").remove();
                g.append("path")
                    .datum(data)
                    .attr("class", "line")
                    .attr("d", line);

                var onClick = function(selected, index, container){
                    d3.event.stopPropagation();
                    var offset = $(container[index]).offset();
                    $scope.selectedWatch = selected;
                    $scope.selectedWatch.pos = offset;
                    $scope.showForm = true;
                    $scope.$apply();
                    drawChart();
                }



                g.selectAll(".watcher-dot").remove();
                var dots = g.selectAll(".watcher-dot")
                    .data(data)
                    .enter()
                    .append("g")
                        .attr("class", "watcher-dot");


                dots.append("circle")
                    .attr("class", function(d){
                        var c = "circle-background";
                        if(d.timestamp == $scope.selectedWatch.timestamp)
                            return c + " circle-background-selected"
                        else if(d[$scope.currency+"_perf"] == -1)
                            c += " circle-danger";
                        else if (d[$scope.currency+"_perf"] == 0)
                            c += " circle-noop";
                        else if (d[$scope.currency+"_perf"] == 1)
                            c += " circle-good-1";
                        else if (d[$scope.currency+"_perf"] == 2)
                            c += " circle-good-2";
                        else if (d[$scope.currency+"_perf"] == 3)
                            c += " circle-good-3";
                        return c;
                    
                    })
                    .attr("cx", function(d) { return x(d.date); })
                    .attr("cy", function(d) { return y(d[$scope.currency+$scope.field]); })
                    .attr("r", 7)
                    .on("click", onClick);

                dots.append("circle")
                    .attr("class", function(d){
                        return "circle" + ([-1,0,1].indexOf(d[$scope.currency+"_perf"])== -1 ? " circle-default" : ""); 
                    })
                    .attr("cx", function(d) { return x(d.date); })
                    .attr("cy", function(d) { return y(d[$scope.currency+$scope.field]); })
                    .attr("r", 4)
                    .on("click", onClick);    
            
                dots.exit().remove();
            }
    
        $('body').click(function(){
            $scope.selectedWatch = {};
            $scope.showForm = false;
            $scope.$apply();
            drawChart();
        })
    
        SyncService.on("watcher", function(watcher){
            
            watcher.date = new Date(watcher.date);
            var w = new APIWatcher(watcher);
            watchers.push(w);
            watchers.shift();
            $scope.$apply();
            drawChart();
        });
        
        $scope.$watch($scope.currency, function(){
            drawChart();
        })
    
        
        var watchers;
        var loadGraph = function(){
             watchers = APIWatcher.query({age: $scope.age}, function(){

                for(var i = watchers.length-1 ; i >= 0; --i){
                    if(watchers[i].XXRPZEUR_ask_price)
                        watchers[i].date = new Date(watchers[i].date);
                    else 
                        watchers.splice(i, 1);
                }

                watchers.sort(function(a, b){
                    if(a.date < b.date) return -1;
                    else if (a.date > b.date) return 1;
                    else return 0;
                })

                drawChart();
            });    
        };
        
        loadGraph();
        $scope.ageChanged = function(){
            loadGraph();
        }
    
    });