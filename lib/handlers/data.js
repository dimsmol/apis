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

	if (ctx.type == 'web') {
		var req = ctx.web.req;
		var json = req.query._json;
		if (json) {
			data = JSON.parse(json);
		}
		else {
			data = ctx.web.req.body;
		}
	}
	else if(ctx.type == 'socket') {
		var body = ctx.socket.body;
		if (body) {
			data = JSON.parse(body);
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
