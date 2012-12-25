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
	this.units.require('core.mechanics.web').start();
};


module.exports = App;
