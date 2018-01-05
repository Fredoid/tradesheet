var url = require('url');
var qs  = require("querystring");

// app/routes.js

module.exports = function(app, api) {

    // server routes ===========================================================
    // handle things like api calls
    // authentication routes
    var func = function(prov){
        return function(req, res) {
            console.log("req", req.query);
            prov(req.body, req.query).then(function(data){
                res.json(data);
            }, function(err){ 
                res.send(err); 
            })
            .catch(function(err){ 
                res.send(err); 
            });
        }
    };
    
    for(var prop in api){
        if(api[prop].handler.indexOf("http") == -1) continue;  
        if(api[prop].providers){
            for(var m in api[prop].providers)
                app[m]("/api/" + prop, func(api[prop].providers[m]));            
        }
        else
            app[api[prop].method || "get"]("/api/" + prop, func(api[prop].provider));        
    }
    
    // frontend routes =========================================================
    // route to handle all angular requests
    app.get('*', function(req, res) {
        res.sendfile('./public/views/index.html'); // load our public/index.html file
    });

};