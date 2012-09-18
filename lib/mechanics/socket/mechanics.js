"use strict";
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var valid = require('valid');
var Ctx = require('../../ctx');
var Result = require('../../handlers/result');
var Transport = require('./transport');
var Request = require('./request');
var Response = require('../core/response');

var any = valid.validators.any;


var Mechanics = function(lib) {
	EventEmitter.call(this);

	this.lib = lib; // expecting sockjs

	this.units = null;

	this.server = null;
	this.handler = null;

	this.prefix = null;

	this.logger = null;
	this.transport = this.createTransport();
	this.resultHandler = this.createResultHandler();
};
inherits(Mechanics, EventEmitter);

Mechanics.prototype.isHttp = false;
Mechanics.prototype.isWebSocket = true;

Mechanics.prototype.unitInit = function (units) {
	this.units = units;

	var settings = units.require('core.settings');
	var coreSettings = settings.core;
	this.handler = units.require('core.handler');

	if (coreSettings.socket && !coreSettings.socket.disable) {
		var web = units.requireInited('core.mechanics.web');
		var logging = units.require('core.logging');

		this.server = this.lib.createServer();
		this.configure(web, logging, this.getSocketPrefix(coreSettings));
	}
};

Mechanics.prototype.createResultHandler = function () {
	return new Result(any);
};

Mechanics.prototype.getSocketPrefix = function (coreSettings) {
	var prefix = coreSettings.prefix;
	var socketPrefix = coreSettings.socket.prefix;
	return prefix ? prefix + socketPrefix : socketPrefix;
};

Mechanics.prototype.configure = function(web, logging, socketPrefix) {
	var server = this.server;

	var options = this.server.options;
	options.prefix = socketPrefix;

	var self = this;

	this.logger = logging.getLogger('sockjs');
	options.log = function (severity, msg) {
		self.logger.log(severity, msg);
	};

	server.on('connection', function (connection) {
		self.onConnect(connection);

		connection.on('data', function (message) {
			self.onMessage(connection, message);
		});

		connection.on('close', function () {
			self.onDisconnect(connection);
		});
	});

	server.installHandlers(web.server);
};

Mechanics.prototype.createTransport = function() {
	return new Transport();
};

Mechanics.prototype.onConnect = function(connection) {
	this.emit('connect', connection);
};

Mechanics.prototype.onDisconnect = function(connection) {
	this.emit('disconnect', connection);
};

Mechanics.prototype.onMessage = function(connection, message) {
	this.emit('message', connection, message);

	if (this.handler == null) {
		throw new Error('No handler set for socket mechanics');
	}

	var decodedMsg = {};
	var err = null;

	try {
		decodedMsg = this.transport.decode(message);
	}
	catch (decodeErr) {
		err = decodeErr;
	}

	var req = new Request(connection, decodedMsg);
	var res = new Response(this);

	var ctx = new Ctx(this, req, res);

	if (err) {
		ctx.setError(err);
		this.getErrorReportingHandler().handle(ctx);
	}
	else if (ctx.subPath(this.prefix)) {
		this.handler.handle(ctx);
	}
};

Mechanics.prototype.getErrorReportingHandler = function () {
	return this.resultHandler;
};

Mechanics.prototype.sendResult = function(ctx, result) {
	this.transport.sendResult(ctx.req, ctx.res, result);
};


module.exports = Mechanics;
