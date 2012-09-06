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
	var req = ctx.req;
	if (ctx.isHttp) {
		var queryBody = req.query.body;
		if (ctx.req.method == 'GET' && queryBody) {
			data = JSON.parse(queryBody);
		}
		else {
			data = req.body;
		}
	}
	else {
		if (req.hasData) {
			data = req.data;
		}
		else if (req.body) {
			data = JSON.parse(req.body);
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
