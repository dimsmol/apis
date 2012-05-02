"use strict";
var inherits = require('util').inherits;
var Handler = require('./handler');
var validate = require('valid').validate;


var Data = function (dataSpec) {
	this.dataSpec = dataSpec;
};
inherits(Data, Handler);

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

Data.prototype.validate = function (ctx, data) {
	return createValidationError(ctx, validate(data, this.dataSpec));
};

Data.prototype.createValidationError = function (validationCtx) {
	var result;
	if (validationCtx.hasErrors()) {
		var errorInfo = ctx.getError();
		result = new ValidationError(
			errorInfo.path,
			errorInfo.code,
			ctx.isDebug() ? errorInfo.msg : null
		);
	}
	return result;
};

Data.data = function (dataSpec) {
	return new Data(dataSpec);
};


module.exports = Data;
