"use strict";
var inherits = require('util').inherits;
var AppBase = require('./app_base');
var Cluster = require('./cluster');


var ClusterMaster = function (opt_options) {
	AppBase.call(this, opt_options);
};
inherits(ClusterMaster, AppBase);

ClusterMaster.prototype.addUnits = function () {
	this.addUnit('core.app');
	this.addUnit('core.logging');
	this.addUnit('core.settings');
	this.addUnit('core.cluster');
};

ClusterMaster.prototype.start = function () {
	this.ensureInited();
	var cluster = this.units.require('core.cluster');
	if (!cluster.isDisabled) {
		cluster.start();
	}
	else {
		this.options.loader.getWorker().start();
	}
};


module.exports = ClusterMaster;
