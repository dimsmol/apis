var inherits = require('util').inherits;

var Handler = require('./handler');


var Data = function () {
};
inherits(Data, Handler);

Data.prototype.handle = function (ctx, next) {
	var data = null;

	if (ctx.type == 'web')
	{
		data = ctx.web.req.body;
	}
	else if(ctx.type == 'socket')
	{
		if (ctx.socket.body)
		{
			data = JSON.parse(ctx.socket.body);
		}
	}

	ctx.data = data;

	next(ctx);
};

var data = function () {
	return new Data();
};


module.exports = {
	Data: Data,
	data: data
};
