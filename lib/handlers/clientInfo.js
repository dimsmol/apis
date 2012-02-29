var inherits = require('util').inherits;

var Handler = require('./handler');


var ClientInfo = function () {
};
inherits(ClientInfo, Handler);

ClientInfo.prototype.handle = function (ctx, next) {
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

	next(ctx);
};


module.exports = {
	ClientInfo: ClientInfo
};
