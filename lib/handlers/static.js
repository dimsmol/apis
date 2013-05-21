"use strict";
var inherits = require('util').inherits;
var send = require('send');
var ops = require('ops');
var errors = require('../errors');
var HttpOnly = require('./http_only');


var Static = function (rootPaths, opt_options) {
	HttpOnly.call(this, opt_options && opt_options.errorHandler);
	this.options = ops.cloneWithDefaults(opt_options, this.getDefaultOptions());

	if (!Array.isArray(rootPaths)) {
		rootPaths = [rootPaths];
	}
	this.rootPaths = rootPaths;
};
inherits(Static, HttpOnly);

Static.prototype.name = 'Static';

Static.prototype.getDefaultOptions = function () {
	return {
		single: false,
		matchKey: 'path',
		pathFunc: null,
		redirect: false,
		maxAge: 0,
		allowIndex: false,
		index: 'index.html'
	};
};

Static.prototype.handleHttpRequest = function (ctx) {
	var path = this.extractPath(ctx);
	this.send(ctx, path);
};

Static.prototype.send = function (ctx, path, idx) {
	idx = idx || 0;
	var options = this.options;
	var self = this;
	var sendStream = send(ctx.req, path)
		.root(this.rootPaths[idx])
		.hidden(options.hidden)
		.maxage(options.maxAge)
		.index(options.allowIndex && options.index)
		.on('error', function (err) {
			if (err.status == 404 && (idx + 1) < self.rootPaths.length) {
				self.send(ctx, path, idx + 1);
			}
			else {
				self.onError(ctx, sendStream, err);
			}
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

Static.st = function (rootPaths, opt_options) {
	return new Static(rootPaths, opt_options);
};


module.exports = Static;
