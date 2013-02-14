"use strict";
var inherits = require('util').inherits;
var send = require('send');
var ops = require('ops');
var errors = require('../errors');
var HttpOnly = require('./http_only');


var Static = function (rootPath, opt_options) {
	HttpOnly.call(this, opt_options && opt_options.errorHandler);
	this.options = ops.cloneWithDefaults(opt_options, {
		single: false,
		matchKey: 'path',
		pathFunc: null,
		redirect: false,
		maxAge: 0,
		allowIndex: false,
		index: 'index.html'
	});

	this.rootPath = rootPath;
};
inherits(Static, HttpOnly);

Static.prototype.name = 'Static';

Static.prototype.handleHttpRequest = function (ctx) {
	var path = this.extractPath(ctx);
	var options = this.options;
	var self = this;
	var sendStream = send(ctx.req, path)
		.root(this.rootPath)
		.hidden(options.hidden)
		.maxage(options.maxAge)
		.index(options.allowIndex && options.index)
		.on('error', function (err) {
			self.onError(ctx, sendStream, err);
		})
		.on('directory', function () {
			self.onDir(ctx, sendStream);
		})
		.on('end', function () {
			self.onEnd(ctx, sendStream);
		});
	sendStream.pipe(ctx.res);
};

Static.prototype.extractPath = function (ctx) {
	var result = '';
	if (!this.options.single) {
		if (this.options.pathFunc != null) {
			result = this.options.pathFunc(this, ctx);
		}
		else if (ctx.pathMatchResult != null && this.options.matchKey != null) {
			result = ctx.pathMatchResult[this.options.matchKey] || '';
		}
	}
	return result;
};

Static.prototype.onError = function (ctx, sendStream, err) {
	var status = err.status;
	if (status != null && status >= 400 && status < 500) {
		if ([400, 403, 404].indexOf(status) != -1) {
			// actually all of these are just bad paths
			err = new errors.NotFound();
		}
		else if (status == 416) {
			err = new errors.RequestedRangeNotSatisfiable();
		}
		// don't expect 'send' to provide any other HTTP errors
	}
	this.error(ctx, err);
};

Static.prototype.onDir = function (ctx, sendStream) {
	var res = ctx.res;
	var path = ctx.res.path;
	if (this.options.redirect && !(path && path[path.length - 1] == '/')) {
		res.redirect(ctx.req.path + '/', 301);
		ctx.responseSent();
		ctx.next();
	}
	else {
		this.error(ctx, new errors.NotFound());
	}
};

Static.prototype.onEnd = function (ctx, sendStream) {
	ctx.res.end();
	ctx.responseSent();
	ctx.next();
};

Static.st = function (rootPath, opt_options) {
	return new Static(rootPath, opt_options);
};


module.exports = Static;
