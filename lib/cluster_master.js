"use strict";
var inherits = require('util').inherits;
var AppBase = require('./app_base');
var Cluster = require('./cluster');


var ClusterMaster = function (opt_options) {
	AppBase.call(this, opt_options);
};
inherits(ClusterMaster, AppBase);

ClusterMaster.prototype.addUnits = function () {
};

ClusterMaster.prototype.start = function () {
	this.ensureInited();
	var cluster = this.units.require('core.cluster');
	var result = null;
	if (!cluster.isDisabled) {
		cluster.start();
	}
	else {
		var worker = this.loader.getWorker();
		result = worker.start();
		if (result == null) {
			result = worker;
		}
	}
	return result;
};


module.exports = ClusterMaster;
