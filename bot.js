// server.js

// modules =================================================
var io = require('socket.io-client')('http://127.0.0.1:8080');

var excluded_currencies = ["XXBTZEUR", "XXRPZEUR"];

var formater = {
    percent: function(number){
        return (Math.round(number*10000)/100) + "%"
    },
    balanceCurrencyLabelToTickerLabel: function(label){
        return (label + (label[0].toLowerCase() != 'x' ? "EUR" : "ZEUR"));
    }
}

var startDate = Date.now();
var running = false;
var warmingup = false;
var previous_ticker = [];
var period = 15 * 60 * 1000;


var best_tickers = [];
var best_ticker = {};
var best_history = [];

/*
>= 28
>= 23 && < 28
>= 18 && < 23
>= 13 && < 18
>= 8 && < 13
>= 5 && < 8
< 5
*/
var ratio_sheet = [
    {min: 0, max: 0.08, ratio: 0.05},
    {min: 0.08, max: 0.13, ratio: 0.1},
    {min: 0.13, max: 0.18, ratio: 0.15},
    {min: 0.18, max: 0.23, ratio: 0.2},
    {min: 0.23, max: 0.28, ratio: 0.25},
    {min: 0.28, max: 1, ratio: 0.3}
]
var ratio = function(r){
    console.log("ratio", r);
    for(var i = 0; i < ratio_sheet.length; ++i)
        if(r >= ratio_sheet[i].min && r < ratio_sheet[i].max)
            return ratio_sheet[i].ratio;
    return ratio_sheet[0].ratio;
} 

var total_speed = 0.0;

setTimeout(function(){
    running = true;
}, period)


var moy = function(tab, filterFunc, propFunc){
    var tt = 0.0, cpt = 0;
    var filtered = tab.filter(filterFunc).forEach(function(elm){
        tt += propFunc(elm);
        cpt++;
    });
    
    return cpt > 0 ? tt / cpt : 0;
}

var limits = function(tab, filterFunc, propFunc){
    var rs = { min : 99999.0, max : 0.0, spread: 0.0}, tmp;
    var t = tab.filter(filterFunc);
    t.forEach(function(elm){
        tmp = propFunc(elm);
        if(tmp < rs.min || tmp > rs.max){
            if(tmp < rs.min)
                rs.min = tmp;
            else if (tmp > rs.max)
                rs.max = tmp;
            rs.spread = rs.max - rs.min;
        }
        
    });
    if(filterFunc(t[0]) > filterFunc(t[t.length-1]))
       rs.spread *= -1;
    return rs;
}

var duration = function(from, to){
    var diff = to - from;
    return (diff > 60000 ? parseInt(diff / 60000) + "m " : "") + (parseInt(diff/1000) % 60) + "s"; 
}

var updateTicker = function(ticker){
    var txt = "Bot receive ticker";
    var tickers = [];
    var previous = running || warmingup
        ? previous_ticker[previous_ticker.length - 1]
        : null;
    
    total_speed = 0.0;
    ticker.date = new Date(ticker.date);
    
    //var acceleration_total = 0.0;
    for(var prop in ticker){
        if(prop == "date" || excluded_currencies.indexOf(prop) > -1) continue;
        ticker[prop].label = prop;
        if(previous != null){
            ticker[prop].date = ticker.date;
            ticker[prop].rate = (((ticker[prop].b[0]-previous[prop].b[0]) * 100)/previous[prop].b[0])/100;
            ticker[prop].speed = (ticker[prop].rate - previous[prop].rate )/ (Math.abs(ticker.date - previous.date) / 1000);
            ticker[prop].moy = moy(previous_ticker, function(item){ return true; }, function(elm){ return elm[prop].speed; });
            ticker[prop].perf = ticker[prop].speed - ticker[prop].moy
            //console.log("rate", prop, ticker[prop].rate, previous[prop].rate);
            //console.log("speed", prop, ticker[prop].speed);
            // ticker[prop].speed_rate = (((ticker[prop].speed - previous[prop].speed) * 100) / previous[prop].speed) / 100;
            //console.log("ticker", ticker);
            //console.log("previous", previous);
            //console.log((ticker[prop].speed - previous[prop].speed) + " / " +(Math.abs(ticker.date - previous.date) / 1000));
            // ticker[prop].acceleration = (ticker[prop].speed-previous[prop].speed) / (Math.abs(ticker.date - previous.date) / 1000);
            if(ticker[prop].speed > 0) 
                total_speed += ticker[prop].speed;
        }
        else {
            ticker[prop].rate = 0.0;
            ticker[prop].speed = 0.0000001;
            // ticker[prop].acceleration = 0.0;
        }
        //acceleration_total += ticker[prop].acceleartion;
        tickers.push(ticker[prop]);
    }
/*
    for(var i = 0 ; i < tickers.length; ++i){
        tickers[i].rate_weight = ((tickers[i].rate * 100) / rate_total)/100;
        // console.log("rate_weight", tickers[i].label, formater.percent(tickers[i].rate_weight));
    }
*/
    
    
    if(previous !=  null){
        tickers.sort(function(a,b){
            if(a.perf < b.perf) return 1;
            if(a.perf > b.perf) return -1;
            else return 0;
        });
        
        var rd = new Date();
        // Managed Best_history lifetime
        
        for(var i = best_history.length - 1 ; i >= 0; --i )
            if((rd - best_history[i].date) > period )
                best_history.splice(i,1);    
            
        
        if(!best_ticker[tickers[0].label]) { 
            best_ticker[tickers[0].label] = { label: tickers[0].label, total: 0.0, moy: 0.0 }; 
            best_tickers.push(best_ticker[tickers[0].label]);
        }
        best_history.push(tickers[0]);
        best_ticker[tickers[0].label].speed = tickers[0].speed;
        best_ticker[tickers[0].label].rate = tickers[0].rate;
        best_ticker[tickers[0].label].moy = tickers[0].moy;
        best_ticker[tickers[0].label].perf = tickers[0].perf;
        best_ticker[tickers[0].label].total += tickers[0].speed;
        best_ticker[tickers[0].label].limits = limits(previous_ticker, function(item){ return true; }, function(elm){ return elm[tickers[0].label].speed; });
        
        
        /*
        
        for(var i = 0 ; i < tickers.length; ++i){
            if(!best_ticker[tickers[i].label]) { 
                best_ticker[tickers[i].label] = { label: tickers[i].label, total: 0.0, moy: 0.0 }; 
                best_tickers.push(best_ticker[tickers[i].label]);
            }

            best_ticker[tickers[i].label].speed = tickers[i].speed;
            best_ticker[tickers[i].label].total += tickers[i].speed;
            best_ticker[tickers[i].label].limits = limits(previous_ticker, function(item){ return true; }, function(elm){ return elm[tickers[i].label].speed; });
            best_ticker[tickers[i].label].perf = tickers[i].speed - best_ticker[tickers[i].label].moy;
        }
        */
        //console.log("oldest history", duration(best_history[0].date, new Date()));
        
        // resort best
        /*
        best_tickers.sort(function(a,b){
            if(a.perf < b.perf) return 1;
            else if(a.perf > b.perf) return -1;
            else return 0;
        });
        */
        
        
        // console.log("Best Tickers", best_tickers);
        
        
        for(var i = 0 ; i < best_tickers.length; ++i){
            best_tickers[i].count = best_history.filter(function(item){ return item.label == best_tickers[i].label }).length;
        }
        
        var check = function(item){
            return item.speed > 0 && item.limits.spread > 0;
        }
        
        var total_count = 0.0;
        for(var i = 0 ; i < best_tickers.length; ++i)
            if(check(best_tickers[i]))
                total_count += best_tickers[i].count;
        
        var total_ratio = 0.0, t_ratio = 0.0;
        for(var i = 0 ; i < best_tickers.length; ++i)
            if(check(best_tickers[i])){
                t_ratio = ratio(((best_tickers[i].count * 100) / total_count)/100);
                best_tickers[i].ratio = t_ratio <= (1 - total_ratio) ? t_ratio : (1 - total_ratio);
                total_ratio += best_tickers[i].ratio;
            }
        
        best_tickers.sort(function(a,b){
            if(a.ratio < b.ratio) return 1;
            else if(a.ratio > b.ratio) return -1;
            else return 0;
        });
        
        var final = {};
        for(var i = 0 ; i < best_tickers.length; ++i){
            best_tickers[i].order = i + 1;
            final[best_tickers[i].label] = best_tickers[i];
        }
        
        // final_order_history.push(pre_final);
        
        /*
        var final = {};
        var finals = [];
        var best;
        var min = 10.0;
        if(final_order_history.length >= final_order_history_size){
            for(var prop in pre_final){
                final[prop] = moy(final_order_history, function(){ return true; }, function(elm){ return  elm[prop];} );
                finals.push({ label: prop, order: final[prop] });
                
                //if(moy(final_order_history, function(){ return true; }, function(elm){ return  elm[prop];} ) <= pre_final[prop])
                //    final[prop] = pre_final[prop];
                //else
                //    final[prop] = final_order_history[final_order_history.length - 2][prop];
                
                if(final[prop] < min ) { best = prop; min = final[prop]; }
                
            }   
            
            final_order_history.shift();
            
            
            finals.sort(function(a, b){
                if(a.order < b.order) return -1;
                else if(a.order > b.order) return 1;
                else return 0;
            })
            
            for(var i = 0; i < finals.length; ++i)
                final[finals[i].label] = i+1;
            
        }
        */
        if(running)
        {
            // console.log("Best Tickers", best_tickers);
            txt = "Best ticker: " + best_tickers[0].label + " " + ticker[best_tickers[0].label].b[0] + " " + previous[best_tickers[0].label].b[0] + " " + ticker[best_tickers[0].label].speed;
            io.emit("info", txt);
            console.log(txt);

            io.emit("bot-data", final);
        }
        else {
            console.log("warming up (still "+ duration(new Date(), startDate + (period)) +")");    
        }
        
    }
    else {
        console.log("not running yet (still "+ duration(new Date(), startDate + period) +")");
    }
    
    
    previous_ticker.push(ticker);
    
    // Managed previous history_Size
    var rd = new Date();
    // Managed Best_history lifetime
    for(var i = previous_ticker.length - 1 ; i >= 0; --i )
        if((rd - previous_ticker[i].date) > period ){
            if(best_ticker[previous_ticker[i].label])
                best_ticker[previous_ticker[i].label].total -= previous_ticker[i].speed;
            previous_ticker.splice(i,1);    
            warmingup = true;
        }
}

var balance = {};
var updateBalance = function(bal){
    balance = {};
    var ticker_label = "";
    for(var prop in bal){
        ticker_label = formater.balanceCurrencyLabelToTickerLabel(prop);
        if(prop == "ZEUR" || prop == "date" || excluded_currencies.indexOf(ticker_label) > -1) continue;
        bal[prop].label = prop;    
        balance[ticker_label] = { amount: bal[prop], value: 0.0 };
        bal[prop].ticker_label = ticker_label;
    }
}

// configuration ===========================================
io.on("tickers", updateTicker);
io.on("balance", updateBalance);

