var KrakenRunner = function(api, apiKey, params){
    
    var self = this;
    
    this.params = params;
    
    var newEvent = function(){
        return { last: null, observer: []};
    }
    
    
    var _events = {}; 
    var _notify = function(event, data){
        if(!_events[event]) _events[event] = newEvent();
        _events[event].last = data;
        for(var i = 0; i < _events[event].observer.length; ++i)
            _events[event].observer[i].cb.apply(data, [data]);
    }
    
    var defaultHandler = function(data){
        setTimeout(exec, api[apiKey].interval);
        data.date = new Date();
        try {
            _notify("refresh", data);
        }
        catch(err){
            defaultErrorHandler(err)    
        }
    }
    
    var defaultErrorHandler = function(err){
        setTimeout(exec, api[apiKey].start);
        try  {
            _notify("error", err);
        }
        catch(err){
            console.error("core error", err);
        }
    }

    var exec = function(){
        api[apiKey].provider(self.params).then(defaultHandler, defaultErrorHandler).catch(defaultErrorHandler);
    }
    
    this.start = function(){
        setTimeout(exec, api[apiKey].start);
    }
    
    this.on = function(event, clientId, cb){
        if(!_events[event]) _events[event] = newEvent();
        _events[event].observer.push({ clientId: clientId, cb: cb});
        if(_events[event].last != null) 
            cb.apply(_events[event].last, [_events[event].last]);
    }
    
    this.unsubscribe = function(event, clientId){
        if(!_events[event]) return;
        for(var i = _events[event].observer.length-1 ; i >= 0; --i)
            if(_events[event].observer[i].clientId == clientId)
                _events[event].observer.splice(i, 1);
        
    }
}

module.exports = KrakenRunner;