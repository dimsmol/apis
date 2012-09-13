"use strict";
var http = require('http');
var cookie = require('cookie');
var Ctx = require('../../ctx');
var JsonpMechanics = require('./jsonp/mechanics');
var Cors = require('./cors');


var Mechanics = function (lib) {
	this.lib = lib;

	this.units = null;
	this.listenSettings = null;
	this.prefix = null;

	this.server = null;
	this.handler = null;

	this.isJsonpEnabled = false;
	this.defaultBodyMaxSize = null;

	this.middleware = this.createMiddleware();
};

Mechanics.prototype.isHttp = true;

Mechanics.prototype.unitInit = function (units) {
	this.units = units;

	var settings = units.require('core.settings');
	this.prefix = settings.core.prefix;
	var webSettings = settings.core.web;
	this.listenSettings = webSettings.listen;
	this.isJsonpEnabled = !webSettings.jsonp.disable;
	this.defaultBodyMaxSize = webSettings.bodyMaxSize;

	this.handler = units.require('core.handler');

	this.server = this.lib.createServer();
	this.configure(settings.core);
};

Mechanics.prototype.extendHttpClasses = function () {
	// extending standard http classes express-way
	// yes, it's evil
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
			}
		});
	}
};

Mechanics.prototype.configure = function (coreSettings) {
	this.extendHttpClasses();

	var server = this.server;
	var lib = this.lib; // expecting express

	var st = coreSettings.web.static;
	var staticPrefix = st.prefix;

	var self = this;

	if (staticPrefix && this.prefix) {
		staticPrefix = this.prefix + staticPrefix;
	}

	if (!coreSettings.debug) {
		server.set('env', 'production');
	}

	server.configure(function () {
		if (self.isJsonpEnabled) {
			server.enable('jsonp callback');
		}
		server.use(staticPrefix, lib.static(st.paths.main));
	});

	server.configure('development', function () {
		server.use(staticPrefix, lib.static(st.paths.dev));
	});

	server.configure(function () {
		server.use(self.middleware);
	});
};

Mechanics.prototype.start = function () {
	var listenSettings = this.listenSettings;
	this.server.listen(listenSettings.port, listenSettings.address);
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
		var cors = this.createCors(ctx);
		ctx.mechanicsData.cors = cors;
		cors.init();

		if (this.defaultBodyMaxSize != null) {
			ctx.mechanicsData.bodyMaxSize = this.defaultBodyMaxSize;
		}

		if (this.isJsonpEnabled && this.isJsonp(req)) {
			this.createJsonpMechanics(ctx).handle();
		}
		else {
			this.handler.handle(ctx);
		}
	}
	else {
		next();
	}
};

Mechanics.prototype.createCors = function (ctx) {
	return new Cors(ctx);
};

Mechanics.prototype.createJsonpMechanics = function (ctx) {
	return new JsonpMechanics(ctx);
};

Mechanics.prototype.isJsonp = function (req) {
	// actually, should also check for method == 'GET', but express doesn't checks, so mimic it
	return !!req.query.callback;
};

Mechanics.prototype.onBodyTooLarge = function (ctx, cb) {
	ctx.req.destroy();
	cb(new Error('Request body is too large')); // TODO valid error message for logging
};

Mechanics.prototype.collectBody = function (ctx, cb) {
	var req = ctx.req;
	var limit = ctx.mechanicsData.bodyMaxSize;

	if (!req.readable) {
		cb(new Error('Body is not readable'));
	}
	else {
		var len = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : null;
		if (len > limit) {
			this.onBodyTooLarge(ctx, cb);
		}
		else {
			var bytes = 0;
			var chunks = [];
			var isFailed = false;
			req.on('data', function (chunk) {
				if (!isFailed) {
					bytes += chunk.length;
					if (limit != null && bytes > limit) {
						isFailed = true;
						this.onBodyTooLarge(ctx, cb);
					}
					else {
						chunks.push(chunk);
					}
				}
			});
			req.on('end', function() {
				if (!isFailed) {
					cb(null, Buffer.concat(chunks));
				}
			});
		}
	}
};

Mechanics.prototype.sendResult = function (ctx, result) {
	ctx.mechanicsData.cors.onBeforeResponse();

	// NOTE can send JSONP if req.query.callback (express feature)
	ctx.res.json(result);
};


module.exports = Mechanics;
