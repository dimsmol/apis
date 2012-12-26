"use strict";
var inherits = require('util').inherits;
var path = require('path');
var fs = require('fs');
var childProcess = require('child_process');
var Unit = require('units').Unit;


var Daemon = function () {
	this.settings = null;
};
inherits(Daemon, Unit);

Daemon.prototype.lockFailedExitCode = 1;
Daemon.prototype.startFailedExitCode = 2;
Daemon.prototype.stopFailedExitCode = 1;
Daemon.prototype.releaseLockFailedExitCode = 2;

Daemon.prototype.unitIsInitRequired = true;

Daemon.prototype.unitInit = function (units) {
	this.settings = units.require('core.settings').core.daemon;
};

Daemon.prototype.start = function () {
	var fd;
	try {
		fd = this.createLock();
	} catch (err) {
		this.reportLockFailed(err);
		process.exit(this.lockFailedExitCode);
	}

	var child = this.createProcess();
	this.reportStarted(child.pid);

	try {
		this.savePid(fd, child.pid);
	} catch (err) {
		this.reportSavePidFailed(err);
	}

	process.exit();
};

Daemon.prototype.stop = function (cb) {
	cb = cb || function (code) {
		process.exit(code);
	};
	this.stopInternal(cb);
};

Daemon.prototype.stopInternal = function (cb) {
	var pid = this.loadPid();
	if (pid == null) {
		this.reportPidFileNotFound();
	}
	else if (isNaN(pid)) {
		this.reportBadPidFile();
		this.releaseLockWithReport();
	}
	else {
		var notFound = false;
		try {
			process.kill(pid);
		}
		catch (err) {
			if (err.code == 'ESRCH') {
				notFound = true;
			}
			else {
				this.reportSignalFailed(err, pid);
				cb(this.stopFailedExitCode);
				return;
			}
		}
		if (notFound) {
			this.reportProcessNotFound(pid);
			this.releaseLockWithReport();
		}
		else {
			this.reportSignalSent(pid);
			var self = this;
			this.waitForExit(pid, function () {
				self.reportStopped();
				self.releaseLockWithReport(true);
				cb();
			});
			return;
		}
	}
	cb();
};

Daemon.prototype.restart = function () {
	var self = this;
	this.stop(function () {
		self.start();
	});
};

// internal stuff

Daemon.prototype.createLock = function () {
	var realPath;
	try {
		realPath = fs.realpathSync(this.settings.pidFile);
	} catch (err) {
		if (err.code == 'ENOENT') {
			realPath = this.settings.pidFile;
		}
		else {
			throw err;
		}
	}
	return fs.openSync(realPath, 'wx');
};

Daemon.prototype.releaseLock = function () {
	try {
		var realPath = fs.realpathSync(this.settings.pidFile);
		fs.unlinkSync(realPath);
	} catch (err) {
		if (err.code != 'ENOENT') {
			throw err;
		}
	}
};

Daemon.prototype.releaseLockWithReport = function (opt_skipSuccessReport) {
	try {
		this.releaseLock();
	}
	catch (err) {
		this.reportReleaseLockFailed(err);
		process.exit(this.releaseLockFailedExitCode);
	}
	if (!opt_skipSuccessReport) {
		this.reportLockReleased();
	}
};

Daemon.prototype.createProcess = function () {
	var child;
	var exec = this.getStartExec();
	var args = this.getStartArgs();
	var options = this.getStartOptions();
	try {
		child = childProcess.spawn(exec, args, options);
	} catch (err) {
		this.startFailed(err);
	}
	return child;
};

Daemon.prototype.startFailed = function (err) {
	this.reportStartFailed(err);
	try {
		this.releaseLock();
	}
	catch (err) {
		this.reportReleaseLockFailed(err);
	}
	process.exit(this.startFailedExitCode);

};

Daemon.prototype.getStartExec = function () {
	return this.settings.start.exec;
};

Daemon.prototype.getStartArgs = function () {
	var startSettings = this.settings.start;
	var result;
	if (startSettings.args != null) {
		if (typeof startSettings.args == 'function') {
			result = startSettings.args(this);
		}
		else {
			result = startSettings.args;
		}
	}
	return result;
};

Daemon.prototype.getStartOptions = function () {
	var startSettings = this.settings.start;

	var stdio = 'ignore';
	if (startSettings.stdout || startSettings.stderr) {
		stdio = ['ignore'];
		var stdout;
		if (startSettings.stdout) {
			try {
				stdout = fs.openSync(startSettings.stdout, 'a');
			}
			catch (err) {
				this.startFailed(err);
			}
		}
		stdio.push(stdout == null ? 'ignore' : stdout);

		var stderr;
		if (startSettings.stderr) {
			if (stdout == stderr) {
				stderr = stdout;
			}
			else {
				try {
					stderr = fs.openSync(startSettings.stderr, 'a');
				}
				catch (err) {
					this.startFailed(err);
				}
			}
		}
		stdio.push(stderr == null ? 'ignore' : stderr);
	}

	return {
		detached: true,
		stdio: stdio
	};
};

Daemon.prototype.savePid = function (fd, pid) {
	fs.truncateSync(fd, 0);

	var buffer = new Buffer(pid+'');
	var written = 0;
	do {
		written += fs.writeSync(fd, buffer, written, buffer.length, written);
	} while(written < buffer.length);
};

Daemon.prototype.loadPid = function () {
	var pidStr = null;
	try {
		pidStr = fs.readFileSync(this.settings.pidFile, 'utf8');
	}
	catch (err) {
		if (err.code != 'ENOENT') {
			throw err;
		}
	}
	var result = null;
	if (pidStr != null) {
		result = parseInt(pidStr, 10);
	}
	return result;
};

Daemon.prototype.waitForExit = function (pid, cb) {
	var self = this;
	setTimeout(function () {
		self.checkIfExited(pid, cb);
	}, this.settings.exitCheckInterval);
};

Daemon.prototype.checkIfExited = function (pid, cb) {
	try {
		process.kill(pid);
	}
	catch (err) {
		if (err.code == 'ESRCH') {
			cb(); // process exited
			return;
		}
		else {
			this.reportSignalFailed(err, pid);
			process.exit(this.stopFailedExitCode);
		}
	}
	this.waitForExit(pid, cb);
};

Daemon.prototype.reportStarted = function (pid) {
	console.log('Started with pid', pid);
};

Daemon.prototype.reportStartFailed = function (err) {
	console.log('Failed to start:', err.message);
};

Daemon.prototype.reportLockFailed = function (err) {
	console.error('Could not obtain lock. Already running?\nError:', err.message);
};

Daemon.prototype.reportSavePidFailed = function (err) {
	console.log('Failed to save pid to file:', err.message);
};

Daemon.prototype.reportLockReleased = function () {
	console.log('Lock released');
};

Daemon.prototype.reportReleaseLockFailed = function (err) {
	console.error('Could not release lock:', err.message);
};

Daemon.prototype.reportStopped = function () {
	console.log('Stopped');
};

Daemon.prototype.reportPidFileNotFound = function (pid) {
	console.log('Pid file not found. Already stopped?');
};

Daemon.prototype.reportBadPidFile = function () {
	console.log('Pid file is invalid, releasing lock...');
};

Daemon.prototype.reportProcessNotFound = function (pid) {
	console.log(['Could not find process ', pid, '. Already stopped?'].join(''));
};

Daemon.prototype.reportSignalSent = function (pid) {
	console.log('Sent termination signal to', pid);
};

Daemon.prototype.reportSignalFailed = function (err, pid) {
	console.error(['Failed to send signal to ', pid, ':', err.message].join(''));
};


module.exports = Daemon;
