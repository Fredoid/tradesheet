var trim = require('trim');
var promise = require('promise');

var util = {
    cleanText : function(value){
        if(typeof value == "undefined" || !value) return "";
        return trim(value).replace(/\s{2}/gmi, " ").replace(/\r/gmi, " ").replace(/\n/gmi, " ").replace(/\t/gmi, " ");
    },
    cleanDecimal : function(value){
        if(typeof value == "undefined" || !value) return 0;
        return parseFloat(util.cleanText(value).replace(" ", "").replace(",", ".").replace(" ", ""));
    },

    sanitize : function(input, def){
        if(typeof input == "undefined" || !input || input == "")
            return def;
        return input;
    },

    toUri: function(url){
        if(typeof url == "undefined" || !url) return "";
        return url.replace(/[.?!,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    },

    round: function(value, decimals){
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    },

    cleanCharacter: function(inputext) {
        var regAccentA = new RegExp("[àâä]", "g");
        var regAccentE = new RegExp("[éèêëÉÈ]", "g");
        var regAccentI = new RegExp("[îïÎ]", "g");
        var regAccentO = new RegExp("[ôö]", "g");
        var regAccentU = new RegExp("[ùûü]", "g");
        var regAccentY = new RegExp("[ÿ]", "g");
        var regCedille = new RegExp("[ç]", "g");
        inputext = inputext.replace(regAccentA, "A");
        inputext = inputext.replace(regAccentE, "E");
        inputext = inputext.replace(regAccentI, "I");
        inputext = inputext.replace(regAccentO, "O");
        inputext = inputext.replace(regAccentU, "U");
        inputext = inputext.replace(regAccentY, "Y");
        inputext = inputext.replace(regCedille, 'C');
        return inputext;
    },
    
    cleanCity: function(city){
    	if(typeof city == "undefined" || !city) return "";
    	city = city.replace(/[0-9]+ème/g, "");
    	city = city.replace(/\([0-9]+\)/g, "")
		return trim(city);
    },
	
	promise: function(func){
		var prom = new promise(func);
		prom.catch(promise.reject);
		return prom;
	}
};

module.exports = util;