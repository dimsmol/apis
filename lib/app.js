"use strict";
var UnitSet = require('units').UnitSet;


var App = function () {
	this.units = null;
};

App.prototype.init = function () {
	this.prepareUnits();
};

App.prototype.prepareUnits = function () {
	this.units = this.createUnits();
	this.initUnits();
};

App.prototype.createUnits = function () {
	var units = new UnitSet();
	// usually you'll need at least:

	//units.add('core.logging', new Logging());
	//units.add('core.mechanics.web', new WebMechanics(express)); // express module

	// your own:
	//units.add('core.settings', MySettings.getSettings());
	//units.add('core.handler', new MyContract());

	// optionally:
	//units.add('core.uncaught', new UncaughtExceptionsHandler());

	// optionally - sockets:
	//units.add('core.mechanics.socket', new SocketMechanics(sockjs)); // sockjs module
	//units.add('core.mechanics.socket.connections', new SocketConnections());
	//units.add('core.mechanics.socket.stat', new SocketStat());
	return units;
};

App.prototype.initUnits = function () {
	this.units.init();
};

App.prototype.start = function () {
	this.units.require('core.mechanics.web').start();
};


module.exports = App;
