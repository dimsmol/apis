"use strict";
var inherits = require('util').inherits;
var AppBase = require('./app_base');


var App = function (opt_options) {
	AppBase.call(this, opt_options);
};
inherits(App, AppBase);

App.prototype.addUnits = function () {
	// add your custom units here
};

App.prototype.start = function () {
	this.ensureInited();
	this.addUncaught();
	this.addSocket();
	this.webStart();
};

App.prototype.addUncaught = function () {
	if (!this.units.require('core.settings').core.uncaught.disabled) {
		this.units.require('core.uncaught');
	}
};

App.prototype.addSocket = function () {
	if (!this.units.require('core.settings').core.socket.disabled) {
		this.units.require('core.mechanics.socket');
	}
};

App.prototype.webStart = function () {
	this.units.require('core.mechanics.web').start();
};

App.prototype.console = function () {
	this.ensureInited();
	global.app = this;
	var repl = require('repl');
	var r = repl.start({ useGlobal: true });
	r.on('exit', function () {
		process.exit();
	});
};

App.prototype.call = function (f) {
	this.ensureInited();
	f.call(this);
};


module.exports = App;
