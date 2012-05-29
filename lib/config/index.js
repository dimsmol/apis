"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;

var Web = require('./web');
var Socket = require('./socket');


var Config = function (libs) {
	this.libs = libs;

	this.web = this.createWebConfig();
	this.socket = this.createSocketConfig();
};
inherits(Config, Unit);

Config.prototype.createWebConfig = function () {
	return new Web(this.libs.web);
};

Config.prototype.createSocketConfig = function () {
	return new Socket(this.libs.socket);
};

Config.Web = Web;
Config.Socket = Socket;


module.exports = Config;
