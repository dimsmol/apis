"use strict";
var util = require('util');
var errors = require('../errors');
var HandlersProcessor = require('./handlers_processor').HandlersProcessor;


var Ctx = function (mechanics, req, res, opt_next) {
	this.mechanics = mechanics;
	this.req = req;
	this.res = res;
	this.outerNext = opt_next;

	this.transportCtx = null;
	this.mechanicsData = {};

	this.appSettings = mechanics.units.require('core.settings');
	this.logging = mechanics.units.require('core.logging');
	this.logger = this.logging.getLogger('ctx');

	this.path = req.path;
	this.method = null;

	this.pathMatchResult = null;

	this.paths = []; // stack of processing subpaths

	this._cb = null;

	this.handlers = new HandlersProcessor();

	this.isResponseSent = false;
	this.isDone = false;

	// for apis handlers
	this.auth = null;
	this.data = null;

	this._result = null;
	this.hasResult = false;

	this._error = null;

	// for other handlers
	// guaranteed to not be used by apis
	this.box = {};
};

Object.defineProperties(Ctx.prototype, {
	isDebug: {
		get: function () {
			return !!this.appSettings.core.debug;
		}
	},
	isHttp: {
		get: function () {
			return this.mechanics.isHttp;
		}
	},
	hasError: {
		get: function () {
			return this._error != null;
		}
	},
	cb: {
		get: function () {
			if (this._cb == null) {
				this._cb = this.createCallback();
			}
			return this._cb;
		}
	}
});

Ctx.prototype.createCallback = function () {
	var self = this;
	return function (err, opt_result) {
		self.callback(err, opt_result);
	};
};

Ctx.prototype.callback = function (err, opt_result) {
	if (err != null) {
		this.error(err);
	}
	else if (arguments.length > 1) {
		this.result(opt_result);
	}
	else {
		this.next();
	}
};

Ctx.prototype.getResult = function () {
	return this._result;
};

Ctx.prototype.setResult = function (result) {
	this._result = result;
	this.hasResult = true;
};

Ctx.prototype.clearResult = function () {
	this._result = null;
	this.hasResult = false;
};

Ctx.prototype.getError = function () {
	return this._error;
};

Ctx.prototype.setError = function (err) {
	this._error = err;
};

Ctx.prototype.clearError = function () {
	this._error = null;
};

Ctx.prototype.responseSent = function () {
	this.isResponseSent = true;
};

Ctx.prototype.subPath = function (path) {
	var matchedPart = null;

	if (!path) {
		matchedPart = '';
	}
	else if (path.constructor === String) {
		if (this.path.indexOf(path) === 0) {
			matchedPart = path;
		}
	}
	else {
		// assuming RegExp-like object
		var matchResult = path.exec(this.path);
		if (matchResult) {
			// must have matched part at idx 0
			matchedPart = matchResult[0];
		}
	}

	if (matchedPart != null) {
		this.paths.push(this.path);
		this.path = this.path.substring(matchedPart.length);
	}

	return matchedPart != null;
};

Ctx.prototype.matchPath = function (path) {
	var result = false;

	if (!path) {
		result = (!this.path);
	}
	else if (path.constructor === String) {
		result = (this.path == path);
	}
	else {
		// assuming RegExp-like object
		var matchResult = path.exec(this.path);
		if (matchResult) {
			this.pathMatchResult = matchResult;
			result = true;
		}
	}

	return result;
};

Ctx.prototype.restorePath = function () {
	this.path = this.paths.pop();
};

Ctx.prototype.enter = function (handlers) {
	this.handlers.enter(handlers);
};

Ctx.prototype.next = function () {
	if (this.isDone) {
		this.logError(new Error('Attempt to call next() when isDone (possible concurent next() calls)'), 'critical');
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

Ctx.prototype.error = function (err) {
	this.setError(err);
	this.next();
};

Ctx.prototype.uncaughtError = function (err) {
	this.logError(err, 'critical', { prefix: 'UncaughtError : ' });
	this.error(err);
};

Ctx.prototype.done = function () {
	this.isDone = true;
	if (this.hasError) {
		this.logDoneWithError();
	}
	this.callOuterNext();
};

Ctx.prototype.callOuterNext = function () {
	if (this.outerNext != null) {
		this.outerNext(this.getError());
	}
};

Ctx.prototype.logDoneWithError = function () {
	this.logError(this.getError(), 'critical', { prefix: 'DoneWithError : ' });
};

Ctx.prototype.logError = function (err, opt_logLevel, opt_options) {
	this.logger.logError(err, opt_logLevel, opt_options);
};

Ctx.prototype.sendResult = function (result) {
	this.mechanics.sendResult(this, result);
};


module.exports = Ctx;
