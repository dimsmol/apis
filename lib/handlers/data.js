"use strict";
var inherits = require('util').inherits;
var ValidatingHandler = require('./core/validating_handler');


var Data = function (dataSpec) {
	ValidatingHandler.call(this, dataSpec);
};
inherits(Data, ValidatingHandler);

Data.prototype.name = 'Data';

Data.prototype.handleRequest = function (ctx) {
	var req = ctx.req;
	if (ctx.isHttp) {
		if (ctx.req.method == 'GET') {
			this.handleRequestWithBody(ctx, req.query.body);
		}
		else {
			// TODO check content type
			var self = this;
			ctx.mechanics.collectBody(ctx, function (err, buffer) {
				if (err != null) {
					ctx.error(err);
				} else {
					var body = null;
					if (buffer) {
						body = buffer.toString('utf-8');
					}
					self.handleRequestWithBody(ctx, body);
				}
			});
		}
	}
	else {
		this.handleRequestWithBody(ctx, req.body);
	}
};

Data.prototype.handleRequestWithBody = function (ctx, body) {
	var data;
	var err = null;
	if (!ctx.isHttp && ctx.req.hasData) {
		data = ctx.req.data;
	}
	else if (body) {
		try {
			data = JSON.parse(body);
		}
		catch (parseErr) {
			err = parseErr; // TODO correct error message
		}
	}

	if (!err) {
		err = this.validate(ctx, data);
		if (!err) {
			ctx.data = data;
			ctx.next();
		}
	}

	if (err) {
		ctx.error(err);
	}
};

Data.data = function (dataSpec) {
	return new Data(dataSpec);
};


module.exports = Data;
