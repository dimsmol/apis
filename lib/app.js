"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;
var UnitSet = require('units').UnitSet;


var App = function () {
	this.units = null;
};
inherits(App, Unit);

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
	//units.add('core.mechanics.web', new WebMechanics());

	// your own:
	//units.add('core.settings', MySettings.getSettings());
	//units.add('core.handler', new MyContract());

	// optional:
	//units.expose('core.app', this);
	//units.add('core.uncaught', new UncaughtExceptionsHandler());
	//units.add('core.cluster', new Cluster());

	// optional - sockets:
	//units.add('core.mechanics.socket', new SocketMechanics());
	//units.add('core.mechanics.socket.connections', new SocketConnections());
	//units.add('core.mechanics.socket.stat', new SocketStat());
	return units;
};

App.prototype.initUnits = function () {
	this.units.init();
};

App.prototype.start = function () {
	var cluster = this.units.get('core.cluster');
	if (cluster && !cluster.isDisabled) {
		cluster.start();
	}
	else {
		this.startWorker();
	}
};

App.prototype.startWorker = function () {
	this.units.require('core.mechanics.web').start();
};


module.exports = App;
