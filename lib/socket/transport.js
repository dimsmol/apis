var Transport = function() {
};

Transport.prototype.encode = function(data, meta) {
	if (meta == null)
	{
		meta = {};
	}
	if (data == null)
	{
		data = null;
	}

	return JSON.stringify({
		meta: meta,
		data: data
	});
};

Transport.prototype.send = function(recipientConnections, data) {
	if (recipientConnections == null || recipientConnections.length == 0)
	{
		return;
	}

	var message = this.encode(data);

	for (var k in recipientConnections)
	{
		var connection = recipientConnections[k];
		connection.write(message);
	}
};

Transport.prototype.sendResult = function(connection, ctx, result) {
	var message = this.encode(result, {
		requestSerial: ctx.clientInfo.serial
	});
	connection.write(message);
};

Transport.prototype.authenticate = function(authToken) {
	return authToken; // TODO replace with normal auth mechanism!!!
};


module.exports = Transport;
