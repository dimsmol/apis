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
	if (!this.units.require('core.settings').core.socket.disabled) {
		// give it chance to start
		this.units.require('core.mechanics.socket');
	}
	this.units.require('core.mechanics.web').start();
};


module.exports = App;
