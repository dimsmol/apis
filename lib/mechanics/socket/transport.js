"use strict";
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var errors = require('../../errors');

var Transport = function() {
	EventEmitter.call(this);

	this.headersSeparator = '\n\n'; // something we don't expect in JSON
};
inherits(Transport, EventEmitter);

Transport.prototype.decode = function(message) {
	var sepPos = message.indexOf(this.headersSeparator);
	if (sepPos == -1) {
		throw new errors.MessageFormatError('Header separator not found');
	}

	var headersStr = message.substring(0, sepPos);
	var body = message.substring(sepPos + this.headersSeparator.length);

	var headers;
	try {
		headers = JSON.parse(headersStr);
	}
	catch (err) {
		throw new errors.HeadersParseError(err);
	}

	return {
		headers: headers,
		body: body
	};
};

Transport.prototype.encode = function(headers, data) {
	headers = headers || {};
	var body;

	if (data === undefined) {
		body = '';
	}
	else {
		// to default content type
		body = JSON.stringify(data);
	}

	return [
		JSON.stringify(headers),
		body
	].join(this.headersSeparator);
};

Transport.prototype.send = function (connection, message) {
	connection.write(message);
	this.emit('message_sent', connection, message);
};

Transport.prototype.sendResult = function(req, res, result) {
	var headers = res.headers;
	headers.status = res.statusCode;
	// NOTE must not set content-type if 204

	var requestId = req.headers.requestId;
	if (requestId != null) {
		headers.requestId = requestId;
	}

	var message = this.encode(headers, result);
	this.send(req.connection, message);
};


module.exports = Transport;
