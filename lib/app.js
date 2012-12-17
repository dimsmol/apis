"use strict";
var inherits = require('util').inherits;
var path = require('path');
var cluster = require('cluster');
var Unit = require('units').Unit;
var UnitSet = require('units').UnitSet;


var App = function (options) {
	this.options = options || {};

	this.isDaemon = false;

	this.isInited = false;
	this.units = null;
};
inherits(App, Unit);

App.prototype.init = function () {
	this.initInternal();
	this.isInited = true;
};

App.prototype.initInternal = function () {
	this.prepareUnits();
};

App.prototype.ensureInited = function () {
	if (!this.isInited) {
		this.init();
	}
};

App.prototype.prepareUnits = function () {
	this.units = this.createUnits();
	this.initUnits();
};

App.prototype.createUnits = function () {
	var units = new UnitSet();
	// usually you'll need at least:

	//units.add('core.app', this);

	//units.add('core.logging', new Logging());
	//units.add('core.mechanics.web', new WebMechanics());

	// your own:
	//units.add('core.settings', MySettings.getSettings());
	//units.add('core.handler', new MyContract());

	// optional:
	//units.add('core.uncaught', new UncaughtExceptionsHandler());
	//units.add('core.daemon', new Daemon());
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

App.prototype.run = function () {
	this.ensureInited();

	var cluster = this.units.get('core.cluster');
	if (cluster && !cluster.isDisabled) {
		cluster.start();
	}
	else {
		this.startWorker();
	}
};

App.prototype.runDaemon = function () {
	this.isDaemon = true;
	this.run();
};

App.prototype.start = function () {
	this.ensureInited();
	this.units.require('core.daemon').start();
};

App.prototype.stop = function () {
	this.ensureInited();
	this.units.require('core.daemon').stop();
};

App.prototype.startWorker = function () {
	this.ensureInited();
	this.units.require('core.mechanics.web').start();
};

App.getApp = function () {
	var App = require(path.join(process.cwd(), 'lib', 'app'));
	return new App();
};


module.exports = App;
