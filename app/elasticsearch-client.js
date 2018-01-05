var elasticsearch = require('elasticsearch');
var extend = require('extend');
var util = require("./util");

var elasticHelper = function(ClientConfig){
    var $this = this;
    this.config = ClientConfig;

    this.elasticClient = null;

    this.SIZE_MAX = 10000;

    /**
     * create the index
     */
    this.initIndex = function () {
        console.log("Create index", $this.config.index);
        return $this.elasticClient.indices.create({
            index: $this.config.index
        });
    };

    /**
     * Check if index exists
     */
    this.indexExists= function () {
        return $this.elasticClient.indices.exists({
            index: $this.config.index
        });
    };

    /**
     * Instanciate new eslatsic search connection
     */
    this.connect = function(){
        $this.elasticClient = new elasticsearch.Client($this.config.connection);
    };

    /**
     * Create mapping
     */
    this.setMapping= function(){
        console.log("Create mapping", $this.config.mapping);
        return $this.elasticClient.indices.putMapping({
            index: $this.config.index,
            type: $this.config.type,
            body: { properties: $this.config.mapping }
        });
    };

    /**
     * Init Client
     */
    this.init = function(){

        return util.promise(function (resolve, reject) {
            $this.connect();
            $this.indexExists().then(function(exists){
                if(!exists){
                    $this.initIndex().then(function(){
                        if($this.config.mapping){
                            $this.setMapping().then(resolve, reject);
                        }
                        else
                            resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        });
    };

    this.ping = function(){

        $this.elasticClient.ping({
            requestTimeout: Infinity,
            hello: "elasticsearch!"
        }, function (error) {
            if (error) {
                console.trace('elasticsearch cluster is down!');
            } else {
                console.log('All is well');
            }
        });
    };

    this.index = function(obj, id){
		return util.promise(function (resolve, reject) {
        var data = {
            index: $this.config.index,
            type: $this.config.type,
            body: obj
        }
        if(id && id != null)
            data.id = id;
        $this.elasticClient.index(data)
        		.then(resolve, reject)
        		.catch(reject);
       });
    }
    
    this.updateOrIndex = function(obj, beforeInsert, beforeUpdate){
    	return util.promise(function (resolve, reject) {

			if(typeof $this.config.keys == "undefined" 
					|| typeof $this.config.keys.push != "function"){
				return reject("Elastic Model's keys not defined");		
			}    		
    		
    		
    		var query = [];
    		$this.config.keys.forEach(function(e, i){
    			query.push(e + ":" + obj[e]);
    		});
    		
    		$this.search({
              q:  query.join(" AND "),
              size: 1
         }).then(function (res) {
         	
         	var newData, id;
				if(res.hits.total > 0) {
					if(typeof beforeUpdate == "function")
						beforeUpdate(obj, res.hits.hits[0]._source);		
					
					newData = extend(true, res.hits.hits[0]._source, obj);
					id = res.hits.hits[0]._id;
				} 
				else {
					if(typeof beforeInsert == "function")
						beforeInsert(obj);		
					
					newData = obj;
					id = null;
				}
         	
				$this.index(newData, id).then(resolve, reject);
				
         }, reject);
      });  	
    }

    this.get = function(id){
        var data = {
            index: $this.config.index,
            type: $this.config.type,
            id: id
        }
        return $this.elasticClient.get(data);
    }

    this.search = function(opts){
        return util.promise(function (resolve, reject) {
            opts.index = $this.config.index;
            $this.elasticClient.search(opts, function (error, response) {
                if(error)
                    return reject(error);

                return resolve(response);
            });
        });
    }

    this.refresh = function(){
        return $this.elasticClient.indices.refresh({ index: $this.config.index, force: true});
    }

    this.bulk = function(){
        var $bulk = this;
        var _bulk = [];
        var autocommit = 50;

        var waiting = false;
        var waiters = [];

        this.update = function(id, obj){
            //if(waiting) return waiters.push({ callee: arguments.callee, args: arguments});
            _bulk.push({ update: { _index: $this.config.index, _type: $this.config.type, _id: id } });
            _bulk.push({doc: obj});
            //if(_bulk.length > 2*autocommit) $bulk.commit();
        };

        this.index = function(obj){
            //if(waiting) return waiters.push({ callee: arguments.callee, args: arguments});
            _bulk.push({ index: { _index: $this.config.index, _type: $this.config.type } });
            _bulk.push(obj);
            //if(_bulk.length > 2*autocommit) $bulk.commit();
        }

        this.delete = function(id, obj){
            //if(waiting) return waiters.push({ callee: arguments.callee, args: arguments});
            _bulk.push({ delete: { _index: $this.config.index, _type: $this.config.type, _id: id } });
            _bulk.push(obj);
            //if(_bulk.length > 2*autocommit) $bulk.commit();
        };

        this.commit = function(){
            return util.promise(function (resolve, reject) {
                //waiting = true;
                if(_bulk.length == 0){
                    console.log("ElasticSearch Bulk is empty");
                    return resolve();
                }

                $this.elasticClient.bulk({body: _bulk}, function (err, resp) {

                    if (err) return reject(err);
                    //waiting = false;
                    /*
                    waiters.forEach(function(element){
                        element.callee.apply(element.callee.caller, element.args);
                    });
                    */
                    _bulk = [];
                    resolve(resp);
                });
            });
        }
    }
};

module.exports = elasticHelper;