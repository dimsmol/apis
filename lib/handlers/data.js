"use strict";
var inherits = require('util').inherits;
var valid = require('valid');
var errors = require('../errors');
var ValidatingHandler = require('./core/validating_handler');

var UnsupportedMediaType = errors.UnsupportedMediaType;
var ParseError = errors.ParseError;

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
		if (req.method == 'GET') {
			this.handleRequestWithBody(ctx, req.query.body);
		}
		else {
			var mediaType = req.mediaType;
			if (mediaType && this.supportedMediaTypes.indexOf(mediaType) == -1) {
				ctx.error(new UnsupportedMediaType(this.supportedMediaTypes));
			}
			else {
				var self = this;
				var limit = ctx.mechanicsData.bodyMaxSize;
				ctx.mechanics.collectBody(req, limit, function (err, buffer) {
					if (err != null) {
						// drop connection on RequestEntityTooLarge (unless in debug)
						if (!ctx.isDebug && errors.WebError.isWebError(err, 413)) {
							req.destroy();
							// force logging to simplify diagnostics
							// because client will not get response at all
							ctx.logError(err, 'warning', { force: true });
							ctx.done();
						}
						else {
							ctx.error(err);
						}
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
			err = new ParseError(parseErr);
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
