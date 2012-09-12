"use strict";
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

	this.middleware = this.createMiddleware();
};

Mechanics.prototype.isHttp = true;

Mechanics.prototype.unitInit = function (units) {
	this.units = units;

	var settings = units.require('core.settings');
	var coreSettings = settings.core;
	this.prefix = coreSettings.prefix;
	this.listenSettings = coreSettings.web.listen;
	this.isJsonpEnabled = !coreSettings.web.jsonp.disable;

	this.handler = units.require('core.handler');

	this.server = this.lib.createServer();
	this.configure(coreSettings);
};

Mechanics.prototype.configure = function (coreSettings) {
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
		server.use(lib.bodyParser());
		server.use(lib.cookieParser());
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
	return !!req.query.callback;
};

Mechanics.prototype.sendResult = function (ctx, result) {
	ctx.mechanicsData.cors.onBeforeResponse();

	// NOTE can send JSONP if req.query.callback (express feature)
	ctx.res.json(result);
};


module.exports = Mechanics;
