var inherits = require('util').inherits;

var HandlerSync = require('./handler_sync');


var ClientInfo = function () {
};
inherits(ClientInfo, HandlerSync);

ClientInfo.prototype.handleSync = function (ctx) {
	var clientInfo = null;

	if (!ctx.auth || ctx.auth.userId == null)
	{
		throw new Error('auth required');
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
		throw new Error('endpoint missed');
	}

	if (clientInfo.serial == null)
	{
		throw new Error('serial missed');
	}

	clientInfo.userId = ctx.auth.userId;

	ctx.clientInfo = clientInfo;
};

ClientInfo.clientInfo = new ClientInfo();


module.exports = ClientInfo;
