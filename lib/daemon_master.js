"use strict";
var inherits = require('util').inherits;
var AppBase = require('./app_base');
var Daemon = require('./daemon');


var DaemonMaster = function (opt_options) {
	AppBase.call(this, opt_options);
};
inherits(DaemonMaster, AppBase);

DaemonMaster.prototype.addUnits = function () {
	this.addUnit('core.app');
	this.addUnit('core.settings');
	this.addUnit('core.daemon');
};

DaemonMaster.prototype.start = function () {
	this.ensureInited();
	this.units.require('core.daemon').start();
};

DaemonMaster.prototype.stop = function () {
	this.ensureInited();
	this.units.require('core.daemon').stop();
};


module.exports = DaemonMaster;
