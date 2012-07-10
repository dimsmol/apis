"use strict";
var Ctx = require('../ctx');
var Transport = require('./transport');
var WebCtx = require('./web_ctx');


var Mechanics = function (units, path) {
	this.units = units;
	this.path = path;

	this.transport = null;
	this.handler = null;

	this.middleware = this.createMiddleware();
	this.transport = this.createTransport();
};

Mechanics.prototype.createMiddleware = function () {
	var self = this;
	return function (req, res, next) {
		self.middlewareHandle(req, res, next);
	};
};

Mechanics.prototype.createTransport = function() {
	return new Transport();
};

Mechanics.prototype.setHandler = function (handler) {
	this.handler = handler;
};

Mechanics.prototype.middlewareHandle = function (req, res, next) {
	var ctx = new Ctx(this.units, req.path, function (err) {
		if (!ctx.isResponseSent) {
			next(err);
		}
	});

	if (!ctx.subPath(this.path)) {
		next();
		return;
	}

	if (this.handler == null)
	{
		throw new Error('No handler set for Mechanics');
	}

	ctx.mechanicsCtx = new WebCtx(this, req, res);

	this.handler.handle(ctx);
};


module.exports = Mechanics;
