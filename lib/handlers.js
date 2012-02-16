var socketSupport = function (ctx, next) {
	var message = JSON.parse(ctx.socket.message);
	var meta = message.meta;

	ctx.meta = meta;
	ctx.path = meta.path;
	ctx.method = meta.method;


	result = {
		ctx: ctx,
		data: message.data
	};

	next(null, ctx);
};

var socketStickConnection = function () {
	var connectionUserData = connection.userData;

	if (connectionUserData.userId == null)
	{
		if (userId == null)
		{
			throw Error('Invalid auth data');
		}
		else
		{
			if (connectionUserData.endPointId != null)
			{
				throw Error('Connection improperly initialized');
			}

			connectionUserData.userId = userId;
			connectionUserData.endPointId = endPointId;

			this.connections.onIdentificationProvided(connection);
		}
	}
	else if (connectionUserData.userId != userId || connectionUserData.endPointId != endPointId)
	{
		throw Error('Invalid auth data');
	}
};

var auth = function (ctx, next) {
	var authToken = ctx.meta.auth;
	if (authToken != null)
	{
		userId = this.authenticate(authToken);
	}

	ctx.auth = {
		userId: userId
	};

	next(null, ctx);
};

var clientData = function (ctx, next) {
	var meta = ctx.meta;

	ctx.clientInfo = {
		endPointId: meta.endPointId,
		serial: meta.serial,
		userId: ctx.auth.userId
	};

	return next();
};

var data = function (ctx, next) {

	return next();
};

var ret = function (ctx, next) {

	return next();
};
