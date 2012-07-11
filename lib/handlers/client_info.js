"use strict";
var inherits = require('util').inherits;
var errors = require('../errors');
var ValidatingHandler = require('./core/validating_handler');
var MetadataValidationError = errors.MetadataValidationError;


var ClientInfo = function (dataSpec) {
	ValidatingHandler.call(this, dataSpec);
};
inherits(ClientInfo, ValidatingHandler);

ClientInfo.prototype.name = 'ClientInfo';

ClientInfo.prototype.extractInfo = function (ctx) {
	var result;
	var headers = ctx.mechanicsCtx.headers;
	if (headers != null) {
		result = {
			endpointId: headers.endpointId,
			serial: headers.serial
		};
	}
	else {
		var req = ctx.mechanicsCtx.req;
		if(req != null)
		{
			if (req.query._endpointId) {
				result = {
					endpointId: req.query._endpointId,
					serial: req.query._serial
				};
			}
		}
	}
	return result;
};

ClientInfo.prototype.handleRequest = function (ctx) {
	var clientInfo;
	if (ctx.mechanicsCtx.parentCtx != null) {
		clientInfo = this.extractInfo(ctx.mechanicsCtx.parentCtx);
	}
	else {
		clientInfo = this.extractInfo(ctx);
	}

	if (ctx.auth != null) {
		clientInfo.userId = ctx.auth.userId;
	}

	var error = this.validate(ctx, clientInfo);
	if (error) {
		ctx.error(error);
	}
	else {
		ctx.clientInfo = clientInfo;
		ctx.next();
	}
};

ClientInfo.prototype.createValidationError = function (ctx, validationCtx) {
	var errorInfo = validationCtx.getError();
	var result = new MetadataValidationError(
		errorInfo.path,
		errorInfo.code,
		errorInfo.validatorInfo,
		errorInfo.message
	);
	return result;
};

ClientInfo.clientInfo = function (dataSpec) {
	return new ClientInfo(dataSpec);
};


module.exports = ClientInfo;
