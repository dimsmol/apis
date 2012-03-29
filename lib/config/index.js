var inherits = require('util').inherits;
var Unit = require('../units').Unit;

var Web = require('./web');
var Socket = require('./socket');


var Config = function (libs) {
	this.libs = libs;

	this.web = null;
	this.socket = null;

	this.defineConfigs();
};
inherits(Config, Unit);

Config.prototype.defineConfigs = function () {
	this.defineWeb();
	this.defineSocket();
};

Config.prototype.defineWeb = function () {
	this.web = new Web(this.libs.web);
};

Config.prototype.defineSocket = function () {
	this.socket = new Socket(this.libs.socket);
};

Config.Web = Web;
Config.Socket = Socket;


module.exports = Config;
