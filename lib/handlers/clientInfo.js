"use strict";
var inherits = require('util').inherits;

var errors = require('../errors');
var HandlerSync = require('./handler_sync');
var MetadataRequired = errors.MetadataRequired;


var ClientInfo = function () {
};
inherits(ClientInfo, HandlerSync);

ClientInfo.prototype.name = 'ClientInfo';

ClientInfo.prototype.handleRequest = function (ctx) {
	var clientInfo = null;

	if (!ctx.auth || ctx.auth.userId == null)
	{
		throw new Error('ClientInfo requires Auth');
	}

	if (ctx.type == 'web')
	{
		clientInfo = {
			endpointId: ctx.web.req.body._endpointId,
			serial: ctx.web.req.body._serial
		};
	}
	else if(ctx.type == 'socket')
	{
		clientInfo = {
			endpointId: ctx.socket.header.endpointId,
			serial: ctx.socket.header.serial
		};
	}

	if (clientInfo.endpointId == null)
	{
		throw new MetadataRequired('endpoint');
	}

	if (clientInfo.serial == null)
	{
		throw new MetadataRequired('serial');
	}

	clientInfo.userId = ctx.auth.userId;

	ctx.clientInfo = clientInfo;
};

ClientInfo.clientInfo = new ClientInfo();


module.exports = ClientInfo;
