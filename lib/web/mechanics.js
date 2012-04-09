"use strict";
var Ctx = require('../ctx');
var InternalError = require('../errors').InternalError;
var Transport = require('./transport');


var Mechanics = function (units, path) {
	this.units = units;
	this.path = path;

	this.transport = null;
	this.handler = null;

	this.init();
};

Mechanics.prototype.init = function() {
	this.defineMiddleware();
	this.defineTransport();
};

Mechanics.prototype.defineMiddleware = function () {
	var self = this;
	this.middleware = function (req, res, next) {
		self.middlewareHandle(req, res, next);
	};
};

Mechanics.prototype.defineTransport = function() {
	this.transport = new Transport();
};

Mechanics.prototype.setHandler = function (handler) {
	this.handler = handler;
};

Mechanics.prototype.middlewareHandle = function (req, res, next) {
	var ctx = new Ctx(this.units, req.path, req.method, next);

	if (!ctx.subPath(this.path))
	{
		next();
		return;
	}

	if (this.handler == null)
	{
		throw new InternalError('No handler set for Mechanics');
	}

	ctx.initWeb({
		req: req,
		res: res,

		transport: this.transport
	});

	this.handler.handle(ctx);
};


module.exports = Mechanics;
