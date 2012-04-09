"use strict";
var Mechanics = require('../socket/mechanics');


var Socket = function (lib) {
	this.lib = lib;
};

Socket.prototype.configure = function (units, server) {
	var coreSettings = units.require('core.settings').core;
	var mechanics = new Mechanics(units, coreSettings.prefix);

	server.on('connection', function (connection) {
		mechanics.onConnect(connection);

		connection.on('data', function (message) {
			mechanics.onMessage(connection, message);
		});

		connection.on('close', function () {
			mechanics.onDisconnect(connection);
		});
	});

	return mechanics;
};


module.exports = Socket;
