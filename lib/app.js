"use strict";
var Units = require('./units/units');


var App = function () {
	this.units = null;
};

App.prototype.init = function () {
	this.prepareUnits();
};

App.prototype.prepareUnits = function () {
	this.units = this.createUnitsCollection();
	this.addUnits();
	this.initUnits();
};

App.prototype.createUnitsCollection = function () {
	return new Units();
};

App.prototype.addUnits = function () {
	// usually you'll need at least:

	//units.add('core.logging', new Logging());
	//units.add('core.lowlevel', new Lowlevel());
	//units.add('core.config', new Config({
	//	web: express, // express module
	//	socket: sockjs // sockjs module
	//}));

	//units.add('core.settings', new Settings(__dirname + '/../..').getPrepared());
	//units.add('core.handler', new MyContract()); // your own contract, properly initialized

	// and optionally:

	//units.add('core.uncaught', new UncaughtExceptionsHandler());
	//units.add('core.connections', new Connections());
};

App.prototype.initUnits = function () {
	this.units.init();
};

App.prototype.start = function () {
	this.units.require('core.lowlevel').start();
};


module.exports = App;
