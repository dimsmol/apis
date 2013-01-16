"use strict";
var http = require('http');
var express = require('express');
var cookie = require('cookie');
var Ctx = require('../../ctx');
var resultHandler = require('../../handlers/result').result;
var errors = require('../../errors');
var crossDomainWorkaround = require('./cross_domain_workaround');
var Cors = require('./cors');

var RequestEntityTooLarge = errors.RequestEntityTooLarge;
var NotFound = errors.NotFound;

var JsonpMechanics = crossDomainWorkaround.JsonpMechanics;
var FrameMechanics = crossDomainWorkaround.FrameMechanics;


var Mechanics = function () {
	this.units = null;
	this.listenSettings = null;
	this.prefix = null;

	this.logger = null;
	this.server = null;
	this.handler = null;

	this.crossDomainWorkaroundSettings = null;
	this.defaultBodyMaxSize = null;
	this.isDomainEnabled = false;

	this.middleware = this.createMiddleware();
	this.resultHandler = this.createResultHandler();
};

Mechanics.prototype.isHttp = true;

Mechanics.prototype.unitInit = function (units) {
	this.units = units;

	var settings = units.require('core.settings');
	this.prefix = settings.core.prefix;
	var webSettings = settings.core.web;
	this.listenSettings = webSettings.listen;

	this.crossDomainWorkaroundSettings = webSettings.crossDomainWorkaround;
	this.defaultBodyMaxSize = webSettings.bodyMaxSize;
	this.isDomainEnabled = !settings.core.domain.disabled;

	this.logger = units.require('core.logging').getLogger('web');
	this.handler = units.require('core.handler');

	this.server = express.createServer();
	this.configure(settings.core);
};

Mechanics.prototype.extendHttpClasses = function () {
	// extending standard http classes express-way
	// yes, this is evil
	if (!http.IncomingMessage.prototype._apisExtended) {
		http.IncomingMessage.prototype._apisExtended = true;
		Object.defineProperties(http.IncomingMessage.prototype, {
			cookies: {
				get: function () {
					if (this._cookies == null) {
						var cookies = this.headers.cookie;
						if (cookies) {
							this._cookies = cookie.parse(cookies);
						}
						else {
							this._cookies = {};
						}
					}
					return this._cookies;
				}
			},
			mediaType: {
				get: function () {
					if (this._mediaType === undefined) {
						var contentType = this.headers['content-type'];
						this._mediaType = contentType ? contentType.split(';')[0] : null;
					}
					return this._mediaType;
				}
			}
		});
	}
};

Mechanics.prototype.configure = function (coreSettings) {
	this.extendHttpClasses();

	var server = this.server;
	if (!coreSettings.debug) {
		server.set('env', 'production');
	}

	var self = this;
	server.configure(function () {
		server.use(self.middleware);
	});
};

Mechanics.prototype.start = function () {
	var listenSettings = this.listenSettings;
	this.server.listen(listenSettings.port, listenSettings.address);
};

Mechanics.prototype.createResultHandler = function () {
	return resultHandler.any;
};

Mechanics.prototype.createMiddleware = function () {
	var self = this;
	return function (req, res, next) {
		if (self.isDomainEnabled) {
			self.middlewareHandleWithinDomain(req, res, next);
		}
		else {
			self.middlewareHandle(null, null, req, res, next);
		}
	};
};

Mechanics.prototype.middlewareHandleWithinDomain = function (req, res, next) {
	var domain = require('domain');

	var self = this;
	var domainInstance = domain.create();
	var ctxContainer = {};

	domainInstance.on('error', function (err) {
		self.handleDomainError(domainInstance, ctxContainer.ctx, req, res, err);
	});

	domainInstance.run(function () {
		process.nextTick(function() {
			self.middlewareHandle(domainInstance, ctxContainer, req, res, next);
		});
	});
};

Mechanics.prototype.middlewareHandle = function (domainInstance, ctxContainer, req, res, next) {
	if (this.handler == null) {
		throw new Error('No handler set for web mechanics');
	}

	req.pause();

	var ctx = new Ctx(this, req, res, function (err) {
		if (!ctx.isResponseSent) {
			next(err);
		}
	});

	if (ctxContainer != null) {
		ctxContainer.ctx = ctx;
	}

	if (ctx.subPath(this.prefix)) {
		if (this.defaultBodyMaxSize != null) {
			ctx.mechanicsData.bodyMaxSize = this.defaultBodyMaxSize;
		}

		var submechanics = this.createSubmechanicsIfNeed(ctx);
		if (submechanics) {
			submechanics.handle();
		}
		else {
			var cors = this.createCors(ctx);
			ctx.mechanicsData.cors = cors;
			cors.init();

			this.handler.handle(ctx);
		}
	}
	else {
		this.handleError(ctx, new NotFound());
	}
};

Mechanics.prototype.handleDomainError = function (domainInstance, ctx, req, res, err) {
	if (ctx != null) {
		var domain = require('domain');

		var self = this;
		var errDomain = domain.create();
		errDomain.on('error', function (nestedErr) {
			try {
				self.logNestedDomainError(ctx, req, nestedErr);
			}
			catch (logErr) {
			}
			self.cleanup(domainInstance, ctx, req, res, err);
		});
		errDomain.run(function () {
			ctx.domainError(err);
		});
	}
	else {
		this.cleanup(domainInstance, ctx, req, res, err);
	}
};

Mechanics.prototype.cleanup = function (domainInstance, ctx, req, res, err) {
	try {
		this.logDomainError(ctx, req, err);
	}
	catch (logErr) {
	}
	try {
		res.destroy();
		req.destroy();
	}
	finally {
		domainInstance.dispose();
	}
};

Mechanics.prototype.logDomainError = function (ctx, req, err) {
	this.logger.logError(err, 'critical', { prefix: 'Unhandled domain error: ' });
};

Mechanics.prototype.logNestedDomainError = function (ctx, req, err) {
	this.logger.logError(err, 'critical', { prefix: 'Nested domain error: ' });
};

Mechanics.prototype.handleError = function (ctx, err) {
	ctx.setError(err);
	this.getErrorReportingHandler().handle(ctx);
};

Mechanics.prototype.getErrorReportingHandler = function () {
	return this.resultHandler;
};

Mechanics.prototype.createCors = function (ctx) {
	return new Cors(ctx);
};

Mechanics.prototype.createJsonpMechanics = function (ctx, callback) {
	return new JsonpMechanics(ctx, callback);
};

Mechanics.prototype.createFrameMechanics = function (ctx) {
	return new FrameMechanics(ctx);
};

Mechanics.prototype.createSubmechanicsIfNeed = function (ctx) {
	var result = null;
	var req = ctx.req;
	if (!this.crossDomainWorkaroundSettings.disabled && req.method == 'GET') {
		var xdomain = ctx.req.query[this.crossDomainWorkaroundSettings.key];
		var jsonpSettings = this.crossDomainWorkaroundSettings.jsonp;
		if (!xdomain && !jsonpSettings.disabled && req.query[jsonpSettings.callbackKey]) {
			// special case for jsonp
			xdomain = 'jsonp';
		}
		if (xdomain) {
			var settings = this.crossDomainWorkaroundSettings[xdomain];
			if (settings && !settings.disabled) {
				switch (xdomain) {
					case 'jsonp':
						var callback = req.query[settings.callbackKey];
						if (callback) {
							result = this.createJsonpMechanics(ctx, callback);
						}
						break;
					case 'frame':
						result = this.createFrameMechanics(ctx);
						break;
				}
			}
		}
	}
	return result;
};

Mechanics.prototype.collectBody = function (req, limit, cb) {
	if (!req.readable) {
		cb(new Error('Body is not readable'));
	}
	else {
		var len = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : null;
		if (limit != null && len > limit) {
			cb(new RequestEntityTooLarge(limit));
		}
		else {
			var bytes = 0;
			var chunks = [];
			var isFailed = false;
			var collectFunc = function (chunk) {
				if (!isFailed) {
					bytes += chunk.length;
					if (limit != null && bytes > limit) {
						isFailed = true;
						chunks = null;
						req.removeListener('data', collectFunc);
						req.removeListener('end', collectedFunc);
						cb(new RequestEntityTooLarge(limit));
					}
					else {
						chunks.push(chunk);
					}
				}
			};
			var collectedFunc = function() {
				if (!isFailed) {
					cb(null, Buffer.concat(chunks));
				}
			};
			req.on('data', collectFunc);
			req.on('end', collectedFunc);
			req.resume();
		}
	}
};

Mechanics.prototype.onBeforeResponse = function (ctx) {
	if (ctx.mechanicsData.cors != null) {
		ctx.mechanicsData.cors.onBeforeResponse();
	}
};

Mechanics.prototype.sendResult = function (ctx, result) {
	this.sendJsonResult(ctx, result);
};

Mechanics.prototype.sendJsonResult = function (ctx, result) {
	this.onBeforeResponse(ctx);

	var res = ctx.res;
	var body = JSON.stringify(result);

	res.charset = res.charset || 'utf-8';
	res.setHeader('Content-Type', 'application/json');

	res.send(body);
};

Mechanics.prototype.sendCrossDomainWorkaroundResult = function (ctx, contentType, body) {
	this.onBeforeResponse(ctx);
	var res = ctx.res;
	res.statusCode = 200;
	res.setHeader('Content-Type', contentType);
	res.send(body);
};

Mechanics.prototype.sendJsonpResult = function (ctx, result, callback) {
	var body = [
		callback, '(', JSON.stringify(result), ');'
	].join('');
	this.sendCrossDomainWorkaroundResult(ctx, 'text/javascript', body);
};

Mechanics.prototype.sendFrameResult = function (ctx, result) {
	var body = [
		'<html><script>(function(){window.parent.postMessage(',
		JSON.stringify(result),
		', \'*\');})();</script><body></body></html>'
	].join('');
	this.sendCrossDomainWorkaroundResult(ctx, 'text/html', body);
};


module.exports = Mechanics;
