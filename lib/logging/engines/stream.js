"use strict";
var inherits = require('util').inherits;
var fs = require('fs');
var Unit = require('units').Unit;


var Stream = function () {
	this.settings = null;
	this.stream = null;
};
inherits(Stream, Unit);

Stream.prototype.unitIsInitRequired = true;

Stream.prototype.createInstance = function (opt_settings) {
	this.settings = opt_settings;
	return this;
};

Stream.prototype.log = function (logger, logLevel, msg, opt_srcName) {
	msg = this.createMessage(logger, logLevel, msg, opt_srcName);
	if (this.ensureStream()) {
		this.write(msg);
	}
	else {
		var isError = (logger.getPriority(logLevel) >= logger.logLevelErrBoundary);
		this.writeToConsole(msg, isError);
	}
};

Stream.prototype.write = function (msg) {
	if (this.stream != null && this.stream.writable) {
		this.stream.write(msg + '\n');
	}
};

Stream.prototype.writeToConsole = function (msg, isError) {
	if (isError) {
		console.error(msg);
	}
	else {
		console.log(msg);
	}
};

Stream.prototype.ensureStream = function () {
	if (this.stream == null && this.settings != null && this.settings.path != null) {
		var options = this.settings.options || {};
		options.flags = options.flags || 'a';
		this.stream = fs.createWriteStream(this.settings.path, options);
		this.stream.on('error', function (err) {
			this.onStreamError(err);
		});
	}

	return (this.stream != null);
};

Stream.prototype.rotate = function () {
	if (this.stream != null) {
		this.stream.destroySoon();
		this.stream = null;
	}
};

Stream.prototype.onStreamError = function (err) {
};

Stream.prototype.createMessage = function (logger, logLevel, msg, opt_srcName) {
	var name = opt_srcName || logger.name;
	return [
		'-- ', new Date().toISOString(), ' [', process.pid, '] [ ', name, ' ', logLevel, ' ] --\n',
		msg, '\n'
	].join('');
};


module.exports = Stream;
