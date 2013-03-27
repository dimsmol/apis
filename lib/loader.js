"use strict";
var path = require('path');
var cluster = require('cluster');


var Loader = function (opt_options) {
	this.options = opt_options;
};

Loader.prototype.getSupportedCommands = function () {
	return ['run', 'start', 'stop', 'restart', 'worker', 'console'];
};

Loader.prototype.run = function (opt_cmd) {
	var cmd = opt_cmd || process.argv[2];
	switch (cmd) {
		case 'run':
			this.getApp().start();
			break;
		case 'start':
			this.getDaemonMaster().start();
			break;
		case 'stop':
			this.getDaemonMaster().stop();
			break;
		case 'restart':
			this.getDaemonMaster().restart();
			break;
		case 'daemon':
			this.getApp({ daemon: true }).start();
			break;
		case 'worker':
			this.getWorker().start();
			break;
		case 'console':
			this.getWorker().console();
			break;
		default:
			this.printUsageAndExit();
	}
};

Loader.prototype.printUsageAndExit = function () {
	console.log('Usage:');
	console.log('\t' + path.basename(process.argv[1]) + ' <command>');
	console.log();
	console.log('Supported commands:');
	console.log('\t' + this.getSupportedCommands().join(' '));
	process.exit(1);
};

Loader.prototype.basePath = 'lib';
Loader.prototype.standardBasePath = __dirname;

Loader.prototype.appFiles = {
	loader: 'loader',
	app: 'app',
	clusterMaster: 'cluster_master',
	daemonMaster: 'daemon_master',
	console: 'console'
};

Loader.prototype.standardUnitPaths = {
	'core.daemon': 'daemon',
	'core.cluster': 'cluster',

	'core.settings': 'settings',
	'core.handler': 'contract',

	'core.logging': 'logging/logging',
	'core.logging.engines.stream': 'logging/engines/stream',
	'core.logging.engines.syslog': 'logging/engines/syslog',

	'core.uncaught': 'uncaught',

	'core.mechanics.web': 'mechanics/web/mechanics',

	// sockets
	'core.mechanics.socket': 'mechanics/socket/mechanics',
	'core.mechanics.socket.stat': 'mechanics/socket/stat/stat'
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

Loader.prototype.getUnitPath = function (name) {
	var result;
	var unitPath = this.unitPaths[name];
	if (unitPath) {
		result = path.join(process.cwd(), this.basePath, unitPath);
	}
	return result;
};

Loader.prototype.resolveUnit = function (name) {
	var result = this.tryRequire(this.getUnitPath(name));
	if (result == null) {
		var path = this.getStandardUnitPath(name);
		if (path) {
			result = require(path);
		}
	}
	return result;
};

Loader.prototype.loadUnit = function (name) {
	var result;
	var Unit = this.resolveUnit(name);
	if (Unit != null) {
		result = new Unit();
	}
	return result;
};

Loader.prototype.getPath = function (name) {
	return path.join(process.cwd(), this.basePath, this.appFiles[name]);
};

Loader.prototype.getStandardPath = function (name) {
	return path.join(this.standardBasePath, this.appFiles[name]);
};

Loader.prototype.tryRequire = function (id) {
	var result;
	if (id) {
		try {
			result = require(id);
		} catch (err) {
			var skipErr = false;
			if (err.code == 'MODULE_NOT_FOUND') {
				try {
					// NOTE ensure we cannot require this particular id,
					// not some of it's dependencies
					require.resolve(id);
				}
				catch (resolveErr) {
					if (resolveErr.code == 'MODULE_NOT_FOUND') {
						skipErr = true;
					}
				}
			}
			if (!skipErr) {
				throw err;
			}
		}
	}
	return result;
};

Loader.prototype.resolve = function (name, opt_skipStandard) {
	var result = this.tryRequire(this.getPath(name));
	if (result == null && !opt_skipStandard) {
		var path = this.getStandardPath(name);
		if (path) {
			result = require(path);
		}
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

Loader.prototype.require = function (name, opt_options, opt_default) {
	var result = this.load(name, opt_options, opt_default);
	if (result == null) {
		throw new Error('Could not load ' + name);
	}
	return result;
};

Loader.prototype.getLoader = function (opt_options) {
	return this.require('loader', opt_options, this);
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
	return this.require('app', opt_options);
};

Loader.prototype.getClusterMaster = function (opt_options) {
	return this.require('clusterMaster', opt_options);
};

Loader.prototype.getDaemonMaster = function (opt_options) {
	return this.require('daemonMaster', opt_options);
};

Loader.create = function (opt_options) {
	return new Loader(opt_options).getLoader(opt_options);
};

Loader.run = function (opt_options) {
	return Loader.create(opt_options).run();
};


module.exports = Loader;
