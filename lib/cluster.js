"use strict";
var cluster = require('cluster');
var os = require('os');
var TimedChecker = require('./tools/timed_checker');


var Cluster = function () {
	this.settings = null;

	this.isDisabled = null;
	this.numberOfWorkers = null;
	this.logger = null;

	this.workersInfo = {};

	this.lazyChecker = null;
	this.zombieChecker = null;
};

Cluster.prototype.unitIsInitRequired = true;

Cluster.prototype.unitInit = function (units) {
	this.settings = units.require('core.settings').core.cluster;
	this.logger = units.require('core.logging').getLogger('cluster');

	this.isDisabled = this.settings.disabled;
	this.numberOfWorkers = (this.settings.numberOfWorkers != null ? this.settings.numberOfWorkers : os.cpus().length);
};

Cluster.prototype.createLazyChecker = function () {
	var self = this;
	return new TimedChecker(function () {
		self.checkLazy(this.items);
	}, this.settings.checks.lazy.interval);
};

Cluster.prototype.createZombieChecker = function () {
	var self = this;
	return new TimedChecker(function () {
		self.checkZombie(this.items);
	}, this.settings.checks.zombie.interval);
};

Cluster.prototype.start = function () {
	this.setupMaster();
	this.createCheckers();
	this.initListeners();
	this.forkWorkers();
};

Cluster.prototype.setupMaster = function () {
	var masterSettings = this.settings.master;
	var settings = {};
	if (masterSettings != null) {
		if (masterSettings.exec != null) {
			settings.exec = masterSettings.exec;
		}
		if (masterSettings.args != null) {
			if (typeof masterSettings.args == 'function') {
				settings.args = masterSettings.args(this);
			}
			else {
				settings.args = masterSettings.args;
			}
		}
		else if (masterSettings.args != null) {
			settings.args = masterSettings.args;
		}
		if (masterSettings.silent != null) {
			settings.silent = masterSettings.silent;
		}
	}
	cluster.setupMaster(settings);
};

Cluster.prototype.createCheckers = function () {
	this.lazyChecker = this.createLazyChecker();
	this.zombieChecker = this.createZombieChecker();
};

Cluster.prototype.initListeners = function () {
	var self = this;
	cluster.on('fork', function(worker) {
		self.onWorkerFork(worker);
	});
	cluster.on('online', function(worker) {
		self.onWorkerOnline(worker);
	});
	cluster.on('listening', function(worker, address) {
		self.onWorkerListening(worker, address);
	});
	cluster.on('disconnect', function(worker) {
		self.onWorkerDisconnect(worker);
	});
	cluster.on('exit', function(worker, code, signal) {
		self.onWorkerExit(worker, code, signal);
	});
};

Cluster.prototype.forkWorkers = function () {
	for (var i = 0; i < this.numberOfWorkers; i++) {
		cluster.fork();
	}
	if (this.numberOfWorkers < 1) {
		this.logger.critical(['No workers forked, numberOfWorkers = ', this.numberOfWorkers].join(''));
	}
	else {
		this.logger.info([this.numberOfWorkers, ' workers forked'].join(''));
	}
};

Cluster.prototype.handleWorkerStateChange = function (worker, state, opt_data, opt_msg, opt_logLevel) {
	this.updateWorkerInfo(worker, state, opt_data);
	this.reportWorkerStateChange(worker, state, opt_data, opt_msg, opt_logLevel);
};

Cluster.prototype.updateWorkerInfo = function (worker, state, opt_data) {
	var info;
	if (state == 'fork') {
		this.workersInfo[worker.id] = info = {
			stateHistory: {}
		};
	}
	else {
		info = this.workersInfo[worker.id];
	}

	info.state = state;
	var historyItem = {
		date: new Date()
	};
	if (opt_data != null) {
		historyItem.data = opt_data;
	}
	info.stateHistory[state] = historyItem;
};

Cluster.prototype.reportWorkerStateChange = function (worker, state, opt_data, opt_msg, opt_logLevel) {
	var logLevel = opt_logLevel || 'debug';
	var parts = ['Worker ', worker.id, ' ', state];
	if (opt_msg) {
		parts.push(', ', opt_msg);
	}
	this.logger.log(logLevel, parts.join(''));
};

Cluster.prototype.onWorkerFork = function (worker) {
	this.lazyChecker.add(worker.id);
	this.handleWorkerStateChange(worker, 'fork');
};

Cluster.prototype.onWorkerOnline = function (worker) {
	this.handleWorkerStateChange(worker, 'online');
};

Cluster.prototype.onWorkerListening = function (worker, address) {
	this.lazyChecker.remove(worker.id);
	this.handleWorkerStateChange(worker, 'listening', address, this.getWorkerListeningMsg(worker, address));
};

Cluster.prototype.getWorkerListeningMsg = function (worker, address) {
	return [
		address.address, ':', address.port
	].join('');
};

Cluster.prototype.onWorkerDisconnect = function (worker) {
	var info = this.workersInfo[worker.id];
	// WARN workaround, sometimes getting exit before disconnect
	if (info && !info.stateHistory.exit) {
		this.zombieChecker.add(worker.id);
		this.handleWorkerStateChange(worker, 'disconnect');
	}
};

Cluster.prototype.onWorkerExit = function (worker, code, signal) {
	this.zombieChecker.remove(worker.id);
	cluster.fork();
	var logLevel = (worker.suicide ? null : 'critical');
	this.handleWorkerStateChange(worker, 'exit', {
		code: code,
		signal: signal,
		isSuicide: worker.suicide
	}, this.getWorkerExitMsg(worker, code, signal), logLevel);
	delete this.workersInfo[worker.id];
};

Cluster.prototype.getWorkerExitMsg = function (worker, code, signal) {
	var parts = ['code = ', code];
	if (worker.suicide) {
		parts.push(', suicide');
	}
	else if (signal != null) {
		parts.push(', signal = ', signal);
	}
	return parts.join('');
};

Cluster.prototype.checkLazy = function (items) {
	for (var k in items) {
		var info = this.workersInfo[k];
		if (info != null && info.stateHistory.listening == null && (Date.now() - info.stateHistory.fork.date) > this.settings.checks.lazy.maxTime) {
			this.reportLazy(k);
			this.lazyChecker.remove(k); // report once
		}
	}
};

Cluster.prototype.reportLazy = function (workerId) {
	this.logger.critical(['Lazy worker detected, worker id = ', workerId].join(''));
};

Cluster.prototype.checkZombie = function (items) {
	for (var k in items) {
		var info = this.workersInfo[k];
		if (info != null && info.stateHistory.exit == null && (Date.now() - info.stateHistory.disconnect.date) > this.settings.checks.zombie.maxTime) {
			this.reportZombie(k);
			this.zombieChecker.remove(k); // report once
		}
	}
};

Cluster.prototype.reportZombie = function (workerId) {
	this.logger.critical(['Zombie worker detected, worker id = ', workerId].join(''));
};


module.exports = Cluster;
