var io = require('socket.io-client')('http://127.0.0.1:8080');
var Promise = require("promise");
var mlFeatures = require("./app/ml-features");
var modelWatch = require("./config/es_models/watch");
var ESClient = require("./app/elasticsearch-client");

// mock
var es_mock = {
    index: function(item){
        return new Promise(function(resolve, reject){
            resolve(item);
        })
    }
}
//var es = es_mock;
var es = new ESClient(modelWatch);

var currents = {};
var history = {};
var history_lifetime = 60 * 60 * 1000;
var watches = [];
var watches_lifetime = 5 * 60 * 1000;
var listerners = ["tickers"];
var listerners = {
    tickers: {}
}

// Socket Listeners
// Maintain up to date Currents bundle
for(var prop in listerners)
    io.on(prop, function(data){
        data.date = new Date(data.date);
        currents[prop] = data;
        
        if(!history[prop]) history[prop] = [];
        history[prop].push(data);
        
        // Clean History
        var rd = new Date();
        for(var i = history[prop].length-1; i >= 0; --i){
            if((rd - history[prop][i].date) > history_lifetime)
                history[prop].splice(i, 1);
        }
    });

// Process Loop 
// duration ms
var loop_duration = 5 * 60 * 1000;
var loop_last_process_date;

var loop_process = function(){
    var n = Date.now();
    var input = { timestamp: n, date: new Date(n) };
    
    for(var prop in mlFeatures)
        if(typeof mlFeatures[prop].adapt == "function")
            mlFeatures[prop].adapt(input, currents, history, watches);
    
    var next = function(){
        // next loop
        setTimeout(loop_process, loop_duration);    
    }
    
    // Historize
    watches.push(input);
    var rd = new Date();
    for(var i = watches.length-1; i >= 0; --i){
        if((rd - watches[i].date) > watches_lifetime)
            watches.splice(i, 1);
    }
    
    // Finalize
    es.index(input).then(function(){
        console.log(input.date, "New input indexed");
        io.emit("watcher", input);
        next();
    }, function(err){
        console.log(input.date, "error indexing data", err);
        next();
    })
    
}

// Launch first process
var start = function(){
    console.log("Start !!!");
    loop_process();
}


es.init().then(start, function(err){
    console.log("Cannot initialize ES", err);
})
