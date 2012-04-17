"use strict";
var errors = require('../errors');
var HandlersProcessor = require('./handlers_processor').HandlersProcessor;


var Ctx = function (units, path, method, next) {
	this.units = units;
	this.path = path;
	this.method = method;
	this.outerNext = next;

	this.appSettings = this.units.require('core.settings');
	this.logging = units.require('core.logging');
	this.logger = this.logging.getLogger('ctx');

	this.origPath = path;

	this.type = null;
	this.web = null;
	this.socket = null;

	this.cb = this.createCallback();

	this._result = null;
	this.hasResult = false;

	this._error = null;
	this.hasError = false;

	this.handlers = new HandlersProcessor();

	this.isResponseSent = false;
	this.isDone = false;

	// stack of processing subpaths
	this.paths = [];
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
	if (error != null)
	{
		this.error(error);
	}
	else
	{
		if (arguments.length > 1)
		{
			this.result(opt_result);
		}
		else
		{
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

Ctx.prototype.ensureNotInited = function (web) {
	if (this.type != null)
	{
		throw new Error('Context already initialized');
	}
};

Ctx.prototype.initWeb = function (web) {
	this.ensureNotInited();

	this.web = web;
	this.type = 'web';
};

Ctx.prototype.initSocket = function (socket) {
	this.ensureNotInited();

	this.socket = socket;
	this.type = 'socket';
};

Ctx.prototype.responseSent = function () {
	this.isResponseSent = true;
};

Ctx.prototype.subPath = function (path) {
	if (!path || this.path.indexOf(path) == 0)
	{
		this.paths.push(this.path);
		if (path)
		{
			this.path = this.path.substring(path.length);
		}
		return true;
	}
	else
	{
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
	if (this.isDone)
	{
		this.unhandledError(new Error('Attempt to call next() when isDone (possible concurent next() calls)'));
	}
	else
	{
		var handler = this.handlers.next();

		if (handler == null)
		{
			this.done();
		}
		else
		{
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

	if (this.hasError)
	{
		this.unhandledError(this.getError());
	}
	else
	{
		this.callOuterNext();
	}
};


Ctx.prototype.callOuterNext = function () {
	if (this.outerNext != null && (!this.isResponseSent || this.type != 'web'))
	{
		this.outerNext(this.getError());
	}
};

Ctx.prototype.unhandledError = function (error) {
	this.logError(error);
	if (this.type == 'web' && !this.isResponseSent)
	{
		// TODO send error as response
	}
	this.clearError();
	this.callOuterNext();
};

Ctx.prototype.logError = function (err) {
	this.logger.logError(err);
};


module.exports = Ctx;
