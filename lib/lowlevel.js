"use strict";
var Lowlevel = function () {
	this.listenSettings = null;

	this.webServer = null;
	this.web = null;

	this.socketServer = null;
	this.socket = null;
};

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

	if (coreSettings.socket && !coreSettings.socket.disable) {
		this.socketServer = sockjs.createServer();
		this.socket = config.socket.configure(units, this.socketServer, this.webServer);
	}

	this.setHandler(handler);
};

Lowlevel.prototype.setHandler = function (handler) {
	this.web.setHandler(handler);
	if (this.socket != null) {
		this.socket.setHandler(handler);
	}
};

Lowlevel.prototype.start = function () {
	var listenSettings = this.listenSettings;
	this.webServer.listen(listenSettings.port, listenSettings.address);
};


module.exports = Lowlevel;
