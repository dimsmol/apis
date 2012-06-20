"use strict";
var SocketCtx = function (mechanics, connection, header, body) {
	this.mechanics = mechanics;
	this.connection = connection;
	this.header = header;
	this.body = body;

	this.hasBody = true;
	this.isBodyParsed = false;
	this.transport = mechanics.transport;
};

SocketCtx.prototype.sendResult = function (status, result) {
	this.transport.sendResult(this, status, result);
};


module.exports = SocketCtx;
