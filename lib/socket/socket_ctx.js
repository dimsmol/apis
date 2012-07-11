"use strict";
var SocketCtx = function (mechanics, connection, headers, body) {
	this.mechanics = mechanics;
	this.connection = connection;
	this.headers = headers;
	this.body = body;

	this.hasBody = true;
	this.isBodyParsed = false;
	this.transport = mechanics.transport;
};

SocketCtx.prototype.sendResult = function (status, result) {
	this.transport.sendResult(this, status, result);
};


module.exports = SocketCtx;