"use strict";
var http = require('http');
var https = require('https');
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


var Mechanics = function () {
	this.units = null;
	this.settings = null;
	this.listenSettings = null;
	this.prefix = null;

	this.logger = null;
	this.server = null;
	this.handler = null;

	this.servers = [];

	this.crossDomainWorkaroundSettings = null;
	this.defaultBodyMaxSize = null;
	this.isDomainEnabled = false;

	this.middleware = this.createMiddleware();
	this.resultHandler = this.createResultHandler();
};

Mechanics.prototype.isHttp = true;

Mechanics.prototype.unitInit = function (units) {
	this.units = units;

	this.settings = units.require('core.settings');
	this.prefix = this.settings.core.prefix;
	var webSettings = this.settings.core.web;
	this.listenSettings = webSettings.listen;
	if (!Array.isArray(this.listenSettings)) {
		this.listenSettings = [this.listenSettings];
	}

	this.crossDomainWorkaroundSettings = webSettings.crossDomainWorkaround;
	this.defaultBodyMaxSize = webSettings.bodyMaxSize;
	this.isDomainEnabled = !this.settings.core.domain.disabled;

	this.logger = units.require('core.logging').getLogger('web');
	this.handler = units.require('core.handler');

	this.createServers();
	this.extendHttpClasses();
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

Mechanics.prototype.createServers = function (coreSettings) {
	for (var i = 0; i < this.listenSettings.length; i++) {
		var settings = this.listenSettings[i];
		var server;
		if (settings.https != null) {
			server = express.createServer(settings.https);
		}
		else {
			server = express.createServer();
		}
		this.configure(server);
		this.servers.push(server);
	}
};

Mechanics.prototype.configure = function (server) {
	if (!this.settings.core.debug) {
		server.set('env', 'production');
	}
	var self = this;
	server.configure(function () {
		server.use(self.middleware);
	});
};

Mechanics.prototype.start = function () {
	for (var i = 0; i < this.servers.length; i++) {
		var settings = this.listenSettings[i];
		this.servers[i].listen(settings.port, settings.address, settings.backlog);
	}
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
			self.middlewareHandleSafe(null, null, req, res, next);
		}
	};
};

Mechanics.prototype.middlewareHandleWithinDomain = function (req, res, next) {
	var domain = require('domain');

	var self = this;
	var domainInstance = domain.create();
	var ctxContainer = {};

	domainInstance.add(req);
    domainInstance.add(res);

	domainInstance.on('error', function (err) {
		self.handleUncaughtError(ctxContainer.ctx, req, res, err);
	});

	domainInstance.run(function () {
		self.middlewareHandleSafe(domainInstance, ctxContainer, req, res, next);
	});
};

Mechanics.prototype.middlewareHandleSafe = function (domainInstance, ctxContainer, req, res, next) {
	ctxContainer = ctxContainer || {};
	try {
		this.middlewareHandle(domainInstance, ctxContainer, req, res, next);
	}
	catch (err) {
		this.handleUncaughtError(ctxContainer.ctx, req, res, err);
	}
};

Mechanics.prototype.middlewareHandle = function (domainInstance, ctxContainer, req, res, next) {
	if (this.handler == null) {
		throw new Error('No handler set for web mechanics');
	}

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

Mechanics.prototype.handleUncaughtError = function (ctx, req, res, err) {
	if (ctx != null) {
		if (this.isDomainEnabled) {
			this.handleUncaughtErrorWithinDomain(ctx, req, res, err);
		}
		else {
			this.handleUncaughtErrorInternal(ctx, req, res, err);
		}
	}
	else {
		this.requestCleanup(ctx, req, res, err);
	}
};

Mechanics.prototype.handleUncaughtErrorWithinDomain = function (ctx, req, res, err) {
	var domain = require('domain');
	var self = this;
	var errDomain = domain.create();
	errDomain.add(req);
    errDomain.add(res);
	errDomain.on('error', function (nestedErr) {
		self.handleNestedUncaughtError(ctx, req, res, err, nestedErr);
	});
	errDomain.run(function () {
		self.handleUncaughtErrorInternal(ctx, req, res, err);
	});
};

Mechanics.prototype.handleUncaughtErrorInternal = function (ctx, req, res, err) {
	try {
		ctx.uncaughtError(err);
	}
	catch (nestedErr) {
		this.handleNestedUncaughtError(ctx, req, res, err, nestedErr);
	}
};

Mechanics.prototype.handleNestedUncaughtError = function (ctx, req, res, err, nestedErr) {
	try {
		this.logNestedUncaughtError(ctx, req, nestedErr);
	}
	catch (logErr) {
	}
	this.requestCleanup(ctx, req, res, err);
};

Mechanics.prototype.requestCleanup = function (ctx, req, res, err) {
	if (err != null) {
		try {
			this.logUncaughtError(ctx, req, err);
		}
		catch (logErr) {
		}
	}
	try {
		res.destroy();
	}
	catch (cleanupErr) {
	}
	try {
		req.destroy();
	}
	catch (cleanupErr) {
	}
};

Mechanics.prototype.logUncaughtError = function (ctx, req, err) {
	this.logger.logError(err, 'critical', { prefix: 'UncaughtError : ' });
};

Mechanics.prototype.logNestedUncaughtError = function (ctx, req, err) {
	this.logger.logError(err, 'critical', { prefix: 'NestedUncaughtError : ' });
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

Mechanics.prototype.createSubmechanicsIfNeed = function (ctx) {
	var result = null;
	var req = ctx.req;
	if (!this.crossDomainWorkaroundSettings.disabled && req.method == 'GET') {
		var crossDomain = ctx.req.query[this.crossDomainWorkaroundSettings.key];
		var jsonpSettings = this.crossDomainWorkaroundSettings.jsonp;
		if (!crossDomain && !jsonpSettings.disabled && req.query[jsonpSettings.callbackKey]) {
			// special case for jsonp
			crossDomain = 'jsonp';
		}
		if (crossDomain) {
			var settings = this.crossDomainWorkaroundSettings[crossDomain];
			if (settings && !settings.disabled) {
				if (crossDomain == 'jsonp') {
					var callback = req.query[settings.callbackKey];
					if (callback) {
						result = this.createJsonpMechanics(ctx, callback);
					}
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


module.exports = Mechanics;
