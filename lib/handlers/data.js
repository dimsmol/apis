"use strict";
var inherits = require('util').inherits;
var valid = require('valid');
var UnsupportedMediaType = require('../errors').UnsupportedMediaType;
var ValidatingHandler = require('./core/validating_handler');

var isNull = valid.validators.isNull;


var Data = function (dataSpec) {
	ValidatingHandler.call(this, dataSpec);
};
inherits(Data, ValidatingHandler);

Data.prototype.name = 'Data';
Data.prototype.supportedMediaTypes = ['application/json'];

Data.prototype.handleRequest = function (ctx) {
	var req = ctx.req;
	if (ctx.isHttp) {
		if (ctx.req.method == 'GET') {
			this.handleRequestWithBody(ctx, req.query.body);
		}
		else {
			var mediaType = ctx.req.mediaType;
			if (mediaType && this.supportedMediaTypes.indexOf(mediaType) == -1) {
				ctx.error(new UnsupportedMediaType(this.supportedMediaTypes));
			}
			else {
				var self = this;
				ctx.mechanics.collectBody(ctx, function (err, stopExecution, buffer) {
					if (!stopExecution) {
						if (err != null) {
							ctx.error(err);
						} else {
							var body = null;
							if (buffer) {
								body = buffer.toString('utf-8');
							}
							self.handleRequestWithBody(ctx, body);
						}
					}
				});
			}
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

Object.defineProperties(Data.data, {
	none: {
		get: function () {
			return Data.data(isNull);
		}
	}
});


module.exports = Data;
