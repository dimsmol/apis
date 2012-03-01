var inherits = require('util').inherits;

var Handler = require('./handler');


var Data = function (dataSpec) {
};
inherits(Data, Handler);

Data.prototype.handle = function (ctx) {
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

	ctx.next();
};

Data.data = function (dataSpec) {
	return new Data(dataSpec);
};


module.exports = Data;
