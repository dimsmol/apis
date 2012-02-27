var Ctx = require('../ctx');

var Connections = require('./connections');
var Transport = require('./transport');


var Mechanics = function(path) {
	this.path = path;

	this.connections = null;
	this.transport = null;
	this.handler = null;

	this.init();
};

Mechanics.prototype.init = function() {
	this.defineConnections();
	this.defineTransport();
};

Mechanics.prototype.defineConnections = function() {
	this.connections = new Connections();
};

Mechanics.prototype.defineTransport = function() {
	this.transport = new Transport();
};

Mechanics.prototype.setHandler = function (handler) {
	this.handler = handler;
};

Mechanics.prototype.onConnect = function(connection) {
	console.log('Connected:', connection.id);
	connection.userData = {};
	this.connections.add(connection);
};

Mechanics.prototype.onDisconnect = function(connection) {
	console.log('Disconnected:', connection.id);
	this.connections.remove(connection);
};

Mechanics.prototype.onMessage = function(connection, message) {
	console.log('\nConnection <'+connection.id+'> message:\n', message);

	var msg = this.transport.decode(message);
	var header = msg.header;
	var body = msg.body;

	var ctx = new Ctx(header.path);

	if (ctx.subPath(this.path))
	{
		if (this.handler == null)
		{
			throw new Error('No handler set');
		}

		ctx.origPath = header.path;
		ctx.method = header.method;

		ctx.initSocket({
			connection: connection,

			header: header,
			body: body,

			transport: this.transport
		});

		this.handler.handle(ctx, function () {});
	}
	else
	{
		// not found
	}
};


module.exports = Mechanics;
