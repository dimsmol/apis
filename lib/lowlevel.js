"use strict";
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

// NOTE implements Unit
var Lowlevel = function () {
	this.isReady = false;

	this.listenSettings = null;

	this.webServer = null;
	this.web = null;

	this.socketServer = null;
	this.socket = null;
};
inherits(Lowlevel, EventEmitter);

Lowlevel.prototype.unitInit = function (units) {
	var config = units.require('core.config');
	var settings = units.require('core.settings');
	var coreSettings = settings.core;
	var handler = units.require('core.handler');

	this.listenSettings = coreSettings.listen;

	var express = config.web.lib;
	var sockjs = config.socket.lib;

	this.webServer = express.createServer();
	this.web = config.web.configure(units, this.webServer);

	if (coreSettings.socket && !coreSettings.socket.disable)
	{
		this.socketServer = sockjs.createServer({
			prefix: settings.getSocketPrefix()
		});
		this.socket = config.socket.configure(units, this.socketServer);

		this.socketServer.installHandlers(this.webServer);
	}

	this.setHandler(handler);

	this.emit('ready');
	this.isReady = true;
};

Lowlevel.prototype.onReady = function (func) {
	if (this.isReady)
	{
		func();
	}
	else
	{
		this.once('ready', func);
	}
};

Lowlevel.prototype.setHandler = function (handler) {
	this.web.setHandler(handler);
	if (this.socket != null)
	{
		this.socket.setHandler(handler);
	}
};

Lowlevel.prototype.start = function () {
	var listenSettings = this.listenSettings;
	this.webServer.listen(listenSettings.port, listenSettings.address);
};


module.exports = Lowlevel;
