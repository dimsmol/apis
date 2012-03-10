var inherits = require('util').inherits;

var InternalError = require('../errors').InternalError;
var HandlerSync = require('./handler_sync');


var RegisterEndpoint = function () {
};
inherits(RegisterEndpoint, HandlerSync);

RegisterEndpoint.prototype.name = 'RegisterEndpoint';

RegisterEndpoint.prototype.handleRequest = function (ctx) {
	if(ctx.type == 'socket')
	{
		if (!ctx.clientInfo)
		{
			throw InternalError('RegisterEndpoint requires ClientInfo');
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
