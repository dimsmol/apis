"use strict";
var inherits = require('util').inherits;
var ValidatingHandler = require('./core/validating_handler');


var Data = function (dataSpec) {
	ValidatingHandler.call(this, dataSpec);
};
inherits(Data, ValidatingHandler);

Data.prototype.name = 'Data';

Data.prototype.handleRequest = function (ctx) {
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

	var error = this.validate(ctx, data);
	if (error) {
		ctx.error(error);
	}
	else {
		ctx.data = data;
		ctx.next();
	}
};

Data.data = function (dataSpec) {
	return new Data(dataSpec);
};


module.exports = Data;
