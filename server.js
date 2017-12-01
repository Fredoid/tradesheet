// server.js

// modules =================================================
var express        = require('express');
var app            = express();
var server = require('http').Server(app);
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var krakenRunner   = require('./app/runner');
var io = require('socket.io')(server);
var extend = require('extend');

// configuration ===========================================

// config files
// var db = require('./config/db');

// set our port
var port = process.env.PORT || 8080; 

// connect to our mongoDB database 
// (uncomment after you enter in your own credentials in config/db.js)
// mongoose.connect(db.url); 

// get all data/stuff of the body (POST) parameters
// parse application/json 
app.use(bodyParser.json()); 

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })); 

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override')); 

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public'));

// routes ==================================================
require('./app/routes')(app); // configure our routes

// start app ===============================================
// startup our app at http://localhost:8080
server.listen(port);

// shoutout to the user                     
console.log('Magic happens on port ' + port);




var api = require("./app/api");
var errorHandler = function(prop){
    return function(err){
        console.error("receive runner error", prop, err);
    }
}

var newHandler = function(prop){
    return function(data){
        console.log("receive runner refresh", prop);
    }
}

var Runners = {};
for(var prop in api){
    if(!api[prop].loadOnStart) continue;
    Runners[prop] = new krakenRunner(api, prop)
    Runners[prop].on("error", "default", errorHandler(prop));
    Runners[prop].on("refresh", "default", newHandler(prop));
    Runners[prop].start();
}

var _pairs = [];
Runners["balance"].on("refresh", 0, function(data){
    var currency = "";
    for(var prop in data){
        currency = prop + "ZEUR";
        if(prop[0] == "X" && _pairs.indexOf(currency) == -1){
            _pairs.push(currency);
            Runners["ticker"].params = { pair : _pairs.join(",") };
            console.log("params");
            console.log(Runners["ticker"].params);
        }        
    }
});


Runners["ticker"].on("refresh", 0, function(data){
    // console.log("new ticker");
    //console.log(data);
});

io.on('connection', function(client){
  // console.log("socket client conected", client);
  for(var prop in Runners){  
    Runners[prop].on("refresh", client.id, (function(key) {
        return function(data){
            console.log("socket client send", key);
            client.emit(key, data);
        }
    })(prop));
  }

  client.on('disconnect', function(){
      console.log("socket client disconected");
      for(var prop in Runners){
          Runners[prop].unsubscribe("refresh", client.id);
      }
  });
    
});

// expose app           
exports = module.exports = app;
