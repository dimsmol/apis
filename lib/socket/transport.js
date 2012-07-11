"use strict";
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var Transport = function() {
	EventEmitter.call(this);

	this.headersSeparator = '\n\n'; // something we don't expect in JSON
};
inherits(Transport, EventEmitter);

Transport.prototype.decode = function(message) {
	var sepPos = message.indexOf(this.headersSeparator);
	var headersStr = message.substring(0, sepPos);
	var body = message.substring(sepPos + this.headersSeparator.length);

	var headers = JSON.parse(headersStr);

	return {
		headers: headers,
		body: body
	};
};

Transport.prototype.encode = function(headers, body) {
	if (body == null) {
		body = null; // force undefined to be null
	}

	// to default content type
	body = JSON.stringify(body);

	return [
		JSON.stringify(headers),
		body
	].join(this.headersSeparator);
};

Transport.prototype.sendSingleMessage = function (connection, message) {
	connection.write(message);
	this.emit('message_sent', connection, message);
};

Transport.prototype.send = function(recipientConnections, data, opt_connectionsToExclude) {
	if (recipientConnections == null || recipientConnections.length == 0) {
		return;
	}

	var message = this.encode({}, data);

	for (var k in recipientConnections) {
		if (!opt_connectionsToExclude || !(k in opt_connectionsToExclude)) {
			var connection = recipientConnections[k];
			this.sendSingleMessage(connection, message);
		}
	}
};

Transport.prototype.addClientSerial = function(ctx, headers) {
	if (ctx.headers.serial) {
		headers.requestSerial = ctx.headers.serial;
	}
};

Transport.prototype.sendResult = function(ctx, status, result) {
	var headers = {
		status: status
	};
	this.addClientSerial(ctx, headers);

	var message = this.encode(headers, result);
	this.sendSingleMessage(ctx.connection, message);
};


module.exports = Transport;
