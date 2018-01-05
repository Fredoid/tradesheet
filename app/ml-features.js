var last = function(history, period){
    if(!history) return [];
    var rd = new Date();
    return history.filter(function(item){
        return (rd-item.date) <= period;
    })
}

var average = function(history, period, propertyFunc){
    var total = 0.0, cpt = 0;
    var tmp;
    history.forEach(function(el){
        tmp = parseFloat(propertyFunc(el));
        if(tmp == -1) return;
        total += tmp;
        cpt++;
    });
    return total / cpt;
}


var tickersAverage = function(label, period){
    return function(input, current, history){
        var range = last(history.tickers, period);
            var diff;
            for(var prop in current.tickers){
                if(prop == "date") continue;
                input[prop+"_" + label] = average(range, period, function(item){
                    return item[prop] ? item[prop].a[0] : -1;
                })
                diff = current.tickers[prop].a[0] - input[prop+"_" + label];
                input[prop+"_" + label + "_perf"] = parseFloat(((diff*100) / input[prop+"_" + label])/100);
            }
        }
}

var tickersRate = function(label, period){
    return function(input, current, history){
            var range = last(history.tickers, period);
            if(range.length == 0) return;
            var diff = 0.0;
            for(var prop in current.tickers){
                if(prop == "date" || !range[0][prop]) continue;
                diff = current.tickers[prop].a[0] - range[0][prop].a[0];
                input[prop+"_" + label] = parseFloat(((diff * 100) / range[0][prop].a[0])/100);
            }
        }
}

var rateAge = function(field){
    return function(input, current, history, watches){
        for(var prop in current.tickers){
            if(prop == "date") continue;
            if(watches.length > 0 && input[prop+"_" + field] >= 0 && watches[watches.length-1][prop+"_" + field] >= 0){
                input[prop+"_" + field+"_age"] = watches[watches.length-1][prop+"_" + field+"_age"] + 1;
            }
            else if (watches.length > 0 && input[prop+"_" + field] < 0 && watches[watches.length-1][prop+"_" + field] < 0){
                input[prop+"_" + field+"_age"] = watches[watches.length-1][prop+"_" + field+"_age"] - 1;
            }
            else {
                input[prop+"_" + field+"_age"] = 0;
            }    
        }
    }
}

var features = {
    
    tickers : { // tickers
        adapt: function(input, last, history){
            for(var prop in last.tickers){
                if(prop == "date") continue;
                input[prop+"_ask_price"] = parseFloat(last.tickers[prop].a[0]);
                input[prop+"_ask_vol"] = parseFloat(last.tickers[prop].a[1]);
                input[prop+"_vol_last24"] = parseFloat(last.tickers[prop].v[1]);
                input[prop+"_weighted_price_last24"] = parseFloat(last.tickers[prop].p[1]);
                input[prop+"_total_trade_last24"] = parseFloat(last.tickers[prop].t[1]);
                input[prop+"_lower_price_last24"] = parseFloat(last.tickers[prop].l[1]);
                input[prop+"_higher_price_last24"] = parseFloat(last.tickers[prop].h[1]);
            }
        }
    },
    
    shortAverage: {
        adapt: tickersAverage("ask_price_avg_5m", 5 * 60 *1000)
    },
    
    mediumAverage: {
        adapt: tickersAverage("ask_price_avg_25m", 25 * 60 *1000)
    },
    longAverage: {
        adapt: tickersAverage("ask_price_avg_60m", 60 * 60 *1000)
    },
    
    shortRate: {
        adapt: tickersRate("ask_rate_5m", 5 * 60 *1000)
    },
    
    mediumRate: {
        adapt: tickersRate("ask_rate_25m", 25 * 60 *1000)
    },
    
    longRate: {
        adapt: tickersRate("ask_rate_60m", 60 * 60 *1000)
    },
    
    shortRateAge: {
        adapt: rateAge("ask_price_avg_5m_perf")
    },
    mediumRateAge: {
        adapt: rateAge("ask_price_avg_25m_perf")
    },
    longRateAge: {
        adapt: rateAge("ask_price_avg_60m_perf")
    },
    
}

module.exports = features;