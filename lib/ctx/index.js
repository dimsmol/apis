var HandlersProcessor = require('./handlers_processor').HandlersProcessor;


var Ctx = function (path, next) {
	this._next = next;
	this.type = null;

	this.method = null;
	this.path = path;

	this.web = null;
	this.socket = null;

	this.cb = this.createCallback();

	this._error = null;
	this.result = null;

	this.handlers = new HandlersProcessor();

	this.isResponseSent = false;

	// stack of processing subpaths
	this.paths = [];
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

Ctx.prototype.callback = function (error, result) {
	if (error != null)
	{
		this.error(error);
	}
	else
	{
		this.next(result);
	}
};

Ctx.prototype.getError = function () {
	return this._error;
};

Ctx.prototype.ensureNotInited = function (web) {
	if (this.type != null)
	{
		throw new Error('Already initialized');
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

Ctx.prototype.next = function (result) {
	this.result = result;

	var handler = null;

	if (!this.isDone)
	{
		handler = this.handlers.next();
	}

	if (handler == null)
	{
		this.done();
	}
	else
	{
		handler.handle(this);
	}
};

Ctx.prototype.error = function (error) {
	this._error = error;
	this.next();
};

Ctx.prototype.done = function () {
	if (this._next != null && (!this.isResponseSent || this.type != 'web'))
	{
		this._next(this.getError());
	}
};


module.exports = Ctx;
