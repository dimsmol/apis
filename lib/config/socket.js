"use strict";
var Mechanics = require('../socket/mechanics');


var Socket = function (lib) {
	this.lib = lib;
};

Socket.prototype.configure = function (units, server, webServer) {
	var settings = units.require('core.settings');
	var logging = units.require('core.logging');

	var coreSettings = settings.core;
	var mechanics = new Mechanics(units, coreSettings.prefix);

	var options = server.options;
	options.prefix = settings.getSocketPrefix();
	var logger = logging.getLogger('sockjs');
	options.log = function (severity, msg) {
		logger.log(severity, msg);
	};

	server.on('connection', function (connection) {
		mechanics.onConnect(connection);

		connection.on('data', function (message) {
			mechanics.onMessage(connection, message);
		});

		connection.on('close', function () {
			mechanics.onDisconnect(connection);
		});
	});

	server.installHandlers(webServer);

	return mechanics;
};


module.exports = Socket;
