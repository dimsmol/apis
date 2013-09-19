"use strict";
var inherits = require('util').inherits;
var mt = require('marked_types');
var valid = require('valid');
var errors = require('../errors');
var ValidatingHandler = require('./core/validating_handler');

var UnsupportedMediaType = errors.UnsupportedMediaType;
var ParseError = errors.ParseError;

var validators = valid.validators;
var any = validators.any;
var isNull = validators.isNull;
var str = validators.str;


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
						if (!ctx.isDebug && mt.is(err, errors.WebError) && err.status == 413) {
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
	any: {
		get: function () {
			return Data.data(any);
		}
	},
	none: {
		get: function () {
			return Data.data(isNull);
		}
	},
	str: {
		get: function () {
			return Data.data(str);
		}
	}
});


module.exports = Data;
