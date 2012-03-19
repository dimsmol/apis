var Ctx = require('../ctx');
var errors = require('../errors');
var Freq = require('../tools/freq');
var Connections = require('./connections');
var Transport = require('./transport');

var InternalError = errors.InternalError;
var NotFound = errors.NotFound;


var Mechanics = function(appSettings, path) {
	this.appSettings = appSettings;
	this.path = path;

	this.connections = null;
	this.transport = null;
	this.handler = null;

	this.freq = new Freq();

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
	connection.userData = {};
	this.connections.add(connection);
};

Mechanics.prototype.onDisconnect = function(connection) {
	this.connections.remove(connection);
};

Mechanics.prototype.onMessage = function(connection, message) {
	this.freq.update();

	var msg = this.transport.decode(message);
	var header = msg.header;
	var body = msg.body;

	var ctx = new Ctx(this.appSettings, header.path, header.method);

	if (ctx.subPath(this.path))
	{
		if (this.handler == null)
		{
			throw new InternalError('No handler set for Mechanics');
		}

		ctx.initSocket({
			connection: connection,

			header: header,
			body: body,

			transport: this.transport,
			connections: this.connections
		});

		this.handler.handle(ctx);
	}
};

module.exports = Mechanics;
