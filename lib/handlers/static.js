"use strict";
var inherits = require('util').inherits;
var send = require('send');
var ops = require('ops');
var errors = require('../errors');
var Handler = require('./core/handler');
var resultHandler = require('./result').result;


var Static = function (rootPath, opt_options) {
	Handler.call(this);
	this.options = ops.cloneWithDefaults(opt_options, {
		single: false,
		matchKey: null,
		pathFunc: null,
		redirect: false,
		maxAge: 0,
		allowIndex: false,
		index: 'index.html'
	});

	this.rootPath = rootPath;
	this.errorHandler = this.options.errorHandler || resultHandler.any;
};
inherits(Static, Handler);

Static.prototype.name = 'Static';

Static.prototype.handleRequest = function (ctx) {
	if (ctx.isHttp) {
		this.handleHttpRequest(ctx);
	}
	else {
		this.error(ctx, new errors.BadRequest('HTTP request expected'));
	}
};

Static.prototype.handleHttpRequest = function (ctx) {
	var options = this.options;
	var self = this;

	send(ctx.req, this.extractPath(ctx))
		.root(this.rootPath)
		.hidden(options.hidden)
		.maxage(options.maxAge)
		.index(options.allowIndex && options.index)
		.on('error', function (err) {
			self.onError(ctx, err);
		})
		.on('directory', function () {
			self.onDir(ctx);
		})
		.on('end', function () {
			self.onEnd(ctx);
		})
		.pipe(ctx.res);
};

Static.prototype.extractPath = function (ctx) {
	var result = '';
	if (!this.options.single) {
		if (this.options.pathFunc != null) {
			result = this.options.pathFunc(this, ctx);
		}
		else if (this.options.matchKey != null) {
			result = ctx.pathMatchResult[this.options.matchKey];
		}
		else if (ctx.pathMatchResult != null && ctx.pathMatchResult.constructor === String) {
			result = ctx.pathMatchResult;
		}
	}
	return result;
};

Static.prototype.onError = function (ctx, err) {
	if (err.status == 404) {
		err = new errors.NotFound();
	}
	this.error(ctx, err);
};

Static.prototype.onDir = function (ctx) {
	var res = ctx.res;
	if (this.options.redirect) {
		res.redirect(ctx.req.path + '/', 301);
		ctx.responseSent();
		ctx.next();
	}
	else {
		this.error(ctx, new errors.NotFound());
	}
};

Static.prototype.onEnd = function (ctx) {
	ctx.res.end();
	ctx.responseSent();
	ctx.next();
};

Static.prototype.error = function (ctx, err) {
	ctx.enter([this.errorHandler]);
	ctx.error(err);
};

Static.st = function (rootPath, opt_options) {
	return new Static(rootPath, opt_options);
};


module.exports = Static;
