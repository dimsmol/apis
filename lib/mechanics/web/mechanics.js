"use strict";
var http = require('http');
var cookie = require('cookie');
var Ctx = require('../../ctx');
var resultHandler = require('../../handlers/result').result;
var errors = require('../../errors');
var JsonpMechanics = require('./jsonp/mechanics');
var Cors = require('./cors');

var RequestEntityTooLarge = errors.RequestEntityTooLarge;
var NotFound = errors.NotFound;


var Mechanics = function (lib) {
	this.lib = lib;

	this.units = null;
	this.listenSettings = null;
	this.prefix = null;

	this.server = null;
	this.handler = null;

	this.isJsonpEnabled = false;
	this.jsonpCallbackKey = null;
	this.defaultBodyMaxSize = null;

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
	this.isJsonpEnabled = !webSettings.jsonp.disable;
	this.jsonpCallbackKey = webSettings.jsonp.callbackKey;
	this.defaultBodyMaxSize = webSettings.bodyMaxSize;

	this.handler = units.require('core.handler');

	this.server = this.lib.createServer();
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
	var lib = this.lib; // expecting express

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
		self.middlewareHandle(req, res, next);
	};
};

Mechanics.prototype.middlewareHandle = function (req, res, next) {
	if (this.handler == null) {
		throw new Error('No handler set for web mechanics');
	}

	var ctx = new Ctx(this, req, res, function (err) {
		if (!ctx.isResponseSent) {
			next(err);
		}
	});

	if (ctx.subPath(this.prefix)) {
		if (this.defaultBodyMaxSize != null) {
			ctx.mechanicsData.bodyMaxSize = this.defaultBodyMaxSize;
		}

		var jsonpCallback = this.getJsonpCallback(ctx.req);
		if (jsonpCallback) {
			this.createJsonpMechanics(ctx, jsonpCallback).handle();
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

Mechanics.prototype.getJsonpCallback = function (req) {
	var result = null;
	if (this.isJsonpEnabled && this.jsonpCallbackKey && req.method == 'GET') {
		result = req.query[this.jsonpCallbackKey];
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

Mechanics.prototype.sendJsonpResult = function (ctx, result, callback) {
	this.onBeforeResponse(ctx);

	var res = ctx.res;
	var json = JSON.stringify(result);
	var body = [
		callback, '(', json, ');'
	].join('');

	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/javascript');
	res.send(body);
};


module.exports = Mechanics;
