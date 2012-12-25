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
	this.socketsOn();
	this.webStart();
};

App.prototype.socketsOn = function () {
	if (!this.units.require('core.settings').core.socket.disabled) {
		// give it chance to start
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
	repl.start({ useGlobal: true });
};


module.exports = App;
