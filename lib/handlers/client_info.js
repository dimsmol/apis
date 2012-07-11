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
	if (ctx.mechanicsCtx.headers != null) {
		result = {
			endpointId: ctx.mechanicsCtx.headers.endpointId,
			serial: ctx.mechanicsCtx.headers.serial
		};
	}
	else if(ctx.mechanicsCtx.req != null)
	{
		if (ctx.mechanicsCtx.req.body._endpointId) {
			result = {
				endpointId: ctx.mechanicsCtx.req.body._endpointId,
				serial: ctx.mechanicsCtx.req.body._serial
			};
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
