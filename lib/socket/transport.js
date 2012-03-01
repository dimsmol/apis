var Transport = function() {
	this.headerSeparator = '\n\n'; // something we don't expect in JSON
};

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

Transport.prototype.send = function(recipientConnections, data) {
	if (recipientConnections == null || recipientConnections.length == 0)
	{
		return;
	}

	var message = this.encode({}, data);

	for (var k in recipientConnections)
	{
		var connection = recipientConnections[k];
		connection.write(message);
	}
};

Transport.prototype.addClientSerial = function(ctx, header) {
	if (ctx.header.serial)
	{
		header.requestSerial = ctx.header.serial;
	}
};

Transport.prototype.sendResult = function(ctx, statusCode, result) {
	var header = {
		statusCode: statusCode
	};
	this.addClientSerial(ctx, header);

	var message = this.encode(header, result);
	ctx.connection.write(message);
};


module.exports = Transport;
