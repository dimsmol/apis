var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var Transport = function() {
	EventEmitter.call(this);

	this.headerSeparator = '\n\n'; // something we don't expect in JSON
};
inherits(Transport, EventEmitter);

Transport.prototype.decode = function(message) {
	var sepPos = message.indexOf(this.headerSeparator);
	var headerStr = message.substring(0, sepPos);
	var body = message.substring(sepPos + this.headerSeparator.length);

	var header = JSON.parse(headerStr);

	return {
		header: header,
		body: body
	};
};

Transport.prototype.encode = function(header, body) {
	if (body == null)
	{
		body = null; // force undefined to be null
	}

	// to default content type
	body = JSON.stringify(body);

	return [
		JSON.stringify(header),
		body
	].join(this.headerSeparator);
};

Transport.prototype.sendSingleMessage = function (connection, message) {
	connection.write(message);
	this.emit('message_sent', connection, message);
};

Transport.prototype.send = function(recipientConnections, data) {
	if (recipientConnections == null || recipientConnections.length == 0)
	{
		return;
	}

	var message = this.encode({}, data);

	for (var k in recipientConnections)
	{
		var connection = recipientConnections[k];
		this.sendSingleMessage(connection, message);
	}
};

Transport.prototype.addClientSerial = function(ctx, header) {
	if (ctx.header.serial)
	{
		header.requestSerial = ctx.header.serial;
	}
};

Transport.prototype.sendResult = function(ctx, status, result) {
	var header = {
		status: status
	};
	this.addClientSerial(ctx, header);

	var message = this.encode(header, result);
	this.sendSingleMessage(ctx.connection, message);
};


module.exports = Transport;
