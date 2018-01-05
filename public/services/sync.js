angular.module('service.sync', [])

.factory('SyncService', function (
         $window
) {
    
    var _callbacks = {};
    var _onthefly = {};
    var _ticks = {};
    
    var notify = function(event){
        if(_callbacks[event])
            for(var i = 0 ; i < _callbacks[event].length; ++i)
                if(typeof _callbacks[event][i] == "function")
                    setTimeout((function(index){ return function(){ _callbacks[event][index](_ticks[event]); } })(i), 0);    
        
        if(_onthefly[event])
            for(var i = 0 ; i < _onthefly[event].length; ++i)
                if(typeof _onthefly[event][i] == "function")
                    setTimeout((function(index){ return function(){ _onthefly[event][i](_ticks[event]); delete _onthefly[event][index]; } })(i), 0);    
    }
    
    var socket = io();
    var events = ["ticker", "balance", "openOrders", "closedOrders", "deposit", "tickers", "info", "bot-data", "watcher"];
    for(var i = 0 ; i < events.length ; ++i) {
        socket.on(events[i], (function(event) {
            return function(data){
                console.log("socket received last", event);
                _ticks[event] = data;
                console.log(data);
                notify(event);
            }
        })(events[i]))
    }
    
    return {
        on: function(event, callback){
            if(!_callbacks[event])
                _callbacks[event] = [];
            _callbacks[event].push(callback);
            if(_ticks[event])
                callback(_ticks[event]);
        },
        
        last: function(event, callback){
            if(_ticks[event]) return callback(_ticks[event]);
            if(!_onthefly[event])
                _onthefly[event] = [];
            _onthefly[event].push(callback);
        }
    }
});
