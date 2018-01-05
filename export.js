var Promise = require("promise");
var modelWatch = require("./config/es_models/watch");
var ESClient = require("./app/elasticsearch-client");
var json2csv = require("json2csv");
var fs = require("fs");
var es = new ESClient(modelWatch);

var tmp;
var params = {
    currency: "XETHZEUR",
    period: 7,
    filepath: "export.csv"
};
for(var i = 2; i < process.argv.length; ++i){
    tmp = process.argv[i].split("=");
    params[tmp[0]] = tmp[1];
}

var to = Date.now(),
    from = to - parseFloat(params.period)*24*60*60*1000;

console.log('Params:');
for(var prop in params)
    console.log('    ' + prop, params[prop]);
console.log('');
console.log("Initializing...");
es.init().then(function(){
    var p = {
        size: 10000,
        sort: [
            "timestamp"
        ],
        q: params.currency + "_perf: (1 OR 0 OR -1)",
        body: {
            query: {
                range : {
                    timestamp : {
                        gte: from,
                        lte: to
                    }
                }
            }
        }
    };
    console.log("Searching...");
    es.search(p).then(function(watchers) {
        var rs = [];
        var fields = [];
        var _fields = [];
        console.log("Packaging...");
        for(var i = 0 ; i < watchers.hits.hits.length; ++i){
            rs.push(watchers.hits.hits[i]._source);
            for(var prop in watchers.hits.hits[i]._source)
                if(_fields.indexOf(prop) == -1){
                    fields.push({ label: prop, value: prop });
                    _fields.push(prop);
                }
        }
        
        var result = "";
        try {
            console.log("Converting...");
            result = json2csv({ data: rs, fields: fields });
        } catch (err) {
            console.error("json2csv Error");
            console.error(err);
        }
        
        console.log("Writing...");
        fs.writeFile(params.filepath, result, function(){
            console.log("Finished !");
        });
        
    }, function(err){
        console.log("ES Search error", err);
        console.log(err);
    }).catch(function(){
        console.log("ES Search error", err);
        console.log(err);
    });
    
}, function(err){
    console.log("Cannot initialize ES", err);
}).catch(function(err){
    console.log("ES Init Error", err);
})
