var inherits = require('util').inherits;

var Handler = require('./handler');


var Auth = function (authenticateFunc) {
	this.authenticateFunc = authenticateFunc;
};
inherits(Auth, Handler);

Auth.prototype.handle = function (ctx) {
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

	ctx.next();
};


module.exports = Auth;
