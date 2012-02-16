var Connections = require('./connections');
var Transport = require('./transport');


var Mechanics = function() {
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

/*	var ctx = new Ctx();

	ctx.path =
	ctx.method =

	ctx.socket = {
	};

	var result = this.handler.handle(ctx, next);
	this.transport.sendResult(connection, ctx, result);*/
};


module.exports = Mechanics;
