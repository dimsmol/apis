"use strict";
var errors = require('../errors');
var HandlersProcessor = require('./handlers_processor').HandlersProcessor;


var Ctx = function (mechanics, req, res, next) {
	this.mechanics = mechanics;
	this.req = req;
	this.res = res;
	this.outerNext = next;

	this.transportCtx = null;
	this.mechanicsData = {};

	this.appSettings = mechanics.units.require('core.settings');
	this.logging = mechanics.units.require('core.logging');
	this.logger = this.logging.getLogger('ctx');

	this.path = req.path;
	this.paths = []; // stack of processing subpaths

	this.method = null;

	this.cb = this.createCallback();

	// for handlers
	this.auth = null;
	this.data = null;

	this._result = null;
	this.hasResult = false;

	this._error = null;
	this.hasError = false;

	this.handlers = new HandlersProcessor();

	this.isResponseSent = false;
	this.isDone = false;
};

Ctx.prototype.getInfo = function () {
	return {
		hasResult: this.hasResult,
		result: this.getResult(),
		hasError: this.hasError,
		error: this.getError(),
		isResponseSent: this.isResponseSent,
		isDone: this.isDone,
		handlers: this.handlers
	};
};

Object.defineProperties(Ctx.prototype, {
	isHttp: {
		get: function () {
			return this.mechanics.isHttp;
		}
	}
});

Ctx.prototype.isDebug = function () {
	return !!this.appSettings.core.debug;
};

Ctx.prototype.createCallback = function () {
	var self = this;
	// std callback
	var result = function (error, result) {
		self.callback(error, result);
	};
	// allow cb.error(...) and cb.next(...) sugar
	result.error = function (error) {
		self.error(error);
	};
	result.next = function (result) {
		self.next(result);
	};

	return result;
};

Ctx.prototype.callback = function (error, opt_result) {
	if (error != null) {
		this.error(error);
	}
	else {
		if (arguments.length > 1) {
			this.result(opt_result);
		}
		else {
			this.next();
		}
	}
};

Ctx.prototype.getResult = function () {
	return this._result;
};

Ctx.prototype.setResult = function (result) {
	this._result = result;
	this.hasResult = true;
};

Ctx.prototype.getError = function () {
	return this._error;
};

Ctx.prototype.setError = function (error) {
	this._error = error;
	this.hasError = true;
};

Ctx.prototype.clearError = function () {
	this._error = null;
	this.hasError = false;
};

Ctx.prototype.responseSent = function () {
	this.isResponseSent = true;
};

Ctx.prototype.subPath = function (path) {
	if (!path || this.path.indexOf(path) === 0) {
		this.paths.push(this.path);
		if (path) {
			this.path = this.path.substring(path.length);
		}
		return true;
	}
	else {
		return false;
	}
};

Ctx.prototype.restorePath = function () {
	this.path = this.paths.pop();
};

Ctx.prototype.enter = function (handlers) {
	this.handlers.enter(handlers);
};

Ctx.prototype.next = function () {
	if (this.isDone) {
		this.unhandledError(new Error('Attempt to call next() when isDone (possible concurent next() calls)'));
	}
	else {
		var handler = this.handlers.next();

		if (handler == null) {
			this.done();
		}
		else {
			handler.handle(this);
		}
	}
};

Ctx.prototype.result = function (result) {
	this.setResult(result);
	this.next();
};

Ctx.prototype.error = function (error) {
	this.setError(error);
	this.next();
};

Ctx.prototype.done = function () {
	this.isDone = true;

	if (this.hasError) {
		this.unhandledError(this.getError());
	}
	else {
		this.callOuterNext();
	}
};

Ctx.prototype.callOuterNext = function () {
	if (this.outerNext != null) {
		this.outerNext(this.getError());
	}
};

Ctx.prototype.unhandledError = function (error) {
	this.logError(error);
	this.callOuterNext();
};

Ctx.prototype.logError = function (err, logLevel) {
	this.logger.logError(err, logLevel);
};

Ctx.prototype.sendResult = function (result) {
	this.mechanics.sendResult(this, result);
};


module.exports = Ctx;
