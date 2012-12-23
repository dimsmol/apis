"use strict";
var path = require('path');
var cluster = require('cluster');


var Loader = function (opt_options) {
	this.options = opt_options;
};

Loader.prototype.basePath = 'lib';
Loader.prototype.standardBasePath = __dirname;

Loader.prototype.fileNames = {
	loader: 'loader',
	app: 'app',
	clusterMaster: 'cluster_master',
	daemonMaster: 'daemon_master'
};

Loader.prototype.standardUnitPaths = {
	'core.daemon': 'daemon',
	'core.cluster': 'cluster',

	'core.logging': 'logging/logging',
	'core.uncaught': 'uncaught',

	'core.mechanics.web': 'mechanics/web/mechanics',

	// sockets
	'core.mechanics.socket': 'mechanics/socket/mechanics',
	'core.mechanics.socket.connections': 'mechanics/socket/connections',
	'core.mechanics.socket.stat': 'mechanics/socket/stat/stat',
};

Loader.prototype.unitPaths = {
	'core.settings': 'settings',
	'core.handler': 'contract'
};

Loader.prototype.getStandardUnitPath = function (name) {
	var result;
	var unitPath = this.standardUnitPaths[name];
	if (unitPath) {
		result = path.join(this.standardBasePath, unitPath);
	}
	return result;
};

Loader.prototype.getLocalUnitPath = function (name) {
	var result;
	var unitPath = this.unitPaths[name];
	if (unitPath) {
		result = path.join(process.cwd(), this.basePath, unitPath);
	}
	return result;
};

Loader.prototype.getUnitPath = function (name) {
	var result = this.getStandardUnitPath(name);
	if (!result) {
		result = this.getLocalUnitPath(name);
	}
	return result;
};

Loader.prototype.loadUnitClass = function (name) {
	var path = this.getUnitPath(name);
	if (!path) {
		throw new Error('Unit ' + name + ' is unknown for loader');
	}
	return require(path);
};

Loader.prototype.getPath = function (name) {
	return path.join(process.cwd(), this.basePath, this.fileNames[name]);
};

Loader.prototype.getStandardPath = function (name) {
	return path.join(this.standardBasePath, this.fileNames[name]);
};

Loader.prototype.tryRequire = function (id) {
	var result;
	try {
		result = require(id);
	} catch (err) {
		if (err.code != 'MODULE_NOT_FOUND') {
			throw err;
		}
	}
	return result;
};

Loader.prototype.resolve = function (name, opt_skipStandard) {
	var result = this.tryRequire(this.getPath(name));
	if (!result && !opt_skipStandard) {
		result = require(this.getStandardPath(name));
	}
	return result;
};

Loader.prototype.load = function (name, opt_options, opt_default) {
	var result = opt_default;
	var AppClass = this.resolve(name, !!opt_default);
	if (AppClass != null) {
		var options = opt_options || {};
		options.loader = this;
		result = new AppClass(options);
	}
	return result;
};

Loader.prototype.getLoader = function (opt_options) {
	return this.load('loader', opt_options, this);
};

Loader.prototype.getApp = function (opt_options) {
	var result;
	if (cluster.isMaster) {
		result = this.getClusterMaster(opt_options);
	}
	if (result == null) {
		result = this.getWorker(opt_options);
	}
	return result;
};

Loader.prototype.getWorker = function (opt_options) {
	return this.load('app', opt_options);
};

Loader.prototype.getClusterMaster = function (opt_options) {
	return this.load('clusterMaster', opt_options);
};

Loader.prototype.getDaemonMaster = function (opt_options) {
	return this.load('daemonMaster', opt_options);
};

Loader.create = function (opt_options) {
	return new Loader(opt_options).getLoader(opt_options);
};


module.exports = Loader;
