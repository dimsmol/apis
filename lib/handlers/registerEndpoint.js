var inherits = require('util').inherits;

var HandlerSync = require('./handler_sync');


var RegisterEndpoint = function () {
};
inherits(RegisterEndpoint, HandlerSync);

RegisterEndpoint.prototype.handleSync = function (ctx) {
	if(ctx.type == 'socket')
	{
		if (!ctx.clientInfo)
		{
			throw new Error('clientInfo required');
		}

		var endpointInfo = {
			userId: ctx.clientInfo.userId,
			endpointId: ctx.clientInfo.endpointId
		};

		ctx.socket.connections.registerEndpoint(ctx.socket.connection, endpointInfo);
	}
};

RegisterEndpoint.registerEndpoint = new RegisterEndpoint();


module.exports = RegisterEndpoint;
