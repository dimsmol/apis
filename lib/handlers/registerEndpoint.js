var inherits = require('util').inherits;

var Handler = require('./handler');


var RegisterEndpoint = function () {
};
inherits(RegisterEndpoint, Handler);

RegisterEndpoint.prototype.handle = function (ctx, next) {
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

	next(ctx);
};


module.exports = {
	RegisterEndpoint: RegisterEndpoint
};
