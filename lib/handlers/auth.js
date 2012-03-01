var inherits = require('util').inherits;

var HandlerSync = require('./handler_sync');


var Auth = function (authenticateFunc) {
	this.authenticateFunc = authenticateFunc;
};
inherits(Auth, HandlerSync);

Auth.prototype.handleSync = function (ctx) {
	var authToken = null;
	var userId = null;

	if (ctx.type == 'web')
	{
		if (ctx.web.req.cookies)
		{
			authToken = ctx.web.req.cookies.auth;
		}
	}
	else if(ctx.type == 'socket')
	{
		authToken = ctx.socket.header.auth;
	}


	if (authToken)
	{
		userId = this.authenticateFunc(authToken);
	}

	// TODO allow optional auth
	if (userId == null)
	{
		// TODO apropriate exception
		throw new Error('Unauthorized');
	}

	ctx.auth = {
		userId: userId
	};
};

Auth.auth = function (authenticateFunc) {
	return new Auth(authenticateFunc);
};


module.exports = Auth;
