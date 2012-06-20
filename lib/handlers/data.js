"use strict";
var inherits = require('util').inherits;
var ValidatingHandler = require('./core/validating_handler');


var Data = function (dataSpec) {
	ValidatingHandler.call(this, dataSpec);
};
inherits(Data, ValidatingHandler);

Data.prototype.name = 'Data';

Data.prototype.handleRequest = function (ctx) {
	var data;
	if (ctx.mechanicsCtx.hasBody) {
		if (ctx.mechanicsCtx.isBodyParsed) {
			data = ctx.mechanicsCtx.body;
		}
		else if (ctx.mechanicsCtx.body) {
			data = JSON.parse(ctx.mechanicsCtx.body);
		}
	}
	else if (ctx.mechanicsCtx.req != null) {
		var req = ctx.mechanicsCtx.req;
		var json = req.query._json;
		if (json) {
			data = JSON.parse(json);
		}
		else {
			data = req.body;
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
