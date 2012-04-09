"use strict";
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var Ctx = require('../ctx');
var errors = require('../errors');
var Transport = require('./transport');
var NotFound = errors.NotFound;


var Mechanics = function(units, path) {
	EventEmitter.call(this);

	this.units = units;
	this.path = path;

	this.transport = null;
	this.handler = null;

	this.transport = this.createTransport();
};
inherits(Mechanics, EventEmitter);

Mechanics.prototype.createTransport = function() {
	return new Transport();
};

Mechanics.prototype.setHandler = function (handler) {
	this.handler = handler;
};

Mechanics.prototype.onConnect = function(connection) {
	this.emit('connect', connection);
};

Mechanics.prototype.onDisconnect = function(connection) {
	this.emit('disconnect', connection);
};

Mechanics.prototype.onMessage = function(connection, message) {
	this.emit('message', connection, message);

	var msg = this.transport.decode(message);
	var header = msg.header;
	var body = msg.body;

	var ctx = new Ctx(this.units, header.path, header.method);

	if (ctx.subPath(this.path))
	{
		if (this.handler == null)
		{
			throw new Error('No handler set for Mechanics');
		}

		ctx.initSocket({
			connection: connection,

			header: header,
			body: body,

			transport: this.transport
		});

		this.handler.handle(ctx);
	}
};

module.exports = Mechanics;
