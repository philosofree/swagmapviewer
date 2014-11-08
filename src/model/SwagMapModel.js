var EventDispatcher = require("../utils/EventDispatcher");
var inherits = require("inherits");
var fs = require("fs");
var SwagItemModel = require("./SwagItemModel");
var request = require('request');
var http = require("http");
var url = require("url");

/**
 * Main swag map model.
 * @class SwagMapModel
 */
function SwagMapModel() {
    this.swagItemModels = [];
}

inherits(SwagMapModel, EventDispatcher);

/**
 * This event is dispatched when the relevant data has been loaded.
 * @event loaded
 */

/**
 * This function will look at its parameter and determine if it is a
 * local file or a url. It will then make the appropriate request 
 * to load the specified resource.
 * @method load
 * @param {Object} pathOrURL The local path or remove url to load.
 */
SwagMapModel.prototype.load = function(pathOrURL) {
    var parsedPathOrURL = url.parse(pathOrURL);
    if (parsedPathOrURL.protocol)
    {
        this.loadUrl(parsedPathOrURL)
    }
    else 
    {

        this.loadFile(pathOrURL)
    } 
}

/**
 * This function loads a local JSON file and stores the list of items.
 * @method loadFile
 */
SwagMapModel.prototype.loadFile = function(jsonPath) {
    fs.readFile(jsonPath, function(err, data) {
        if (err) {
            console.log("Error" + err);
            return;
        }
        var dataitems = JSON.parse(data);
        for (var i = 0; i < dataitems.items.length; i++){
            this.swagItemModels.push(new SwagItemModel(dataitems.items[i]));
        }
        
        this.trigger("loaded");

    }.bind(this));
}

/**
 * This function loads a local JSON file and stores the list of items.
 * @method loadUrl
 */
SwagMapModel.prototype.loadUrl = function (jsonUrl){
    var options = {
        url: jsonUrl,
    };
    request(options, function(error, response, body){
    if (!error && response.statusCode == 200){
       var dataitems = JSON.parse(body);
       for (var i = 0; i < dataitems.items.length; i++){
            this.swagItemModels.push(new SwagItemModel(dataitems.items[i]));
        }
    }
    this.trigger("loaded");
    }.bind(this));
}

/**
 * This function gets data items from swagItemModels 
 * @method getItemDatas
 */
SwagMapModel.prototype.getItemDatas = function() {
    var itemDatas = [];
    for (var i = 0; i < this.swagItemModels.length; i++){
        var x = this.swagItemModels[i].x;
        var y = this.swagItemModels[i].y;
        itemDatas.push(this.swagItemModels[i].getSwagItemData(x, y));
    }
    return itemDatas;
}

/**
 * This function gets swag item models
 * @method getSwagItemModels
 */
SwagMapModel.prototype.getSwagItemModels = function (){
    return this.swagItemModels;
}

module.exports = SwagMapModel;