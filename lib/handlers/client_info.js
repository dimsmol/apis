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

ClientInfo.prototype.handleRequest = function (ctx) {
	var clientInfo;

	if (ctx.type == 'web')
	{
		clientInfo = {
			endpointId: ctx.web.req.body._endpointId,
			serial: ctx.web.req.body._serial
		};
	}
	else if(ctx.type == 'socket')
	{
		clientInfo = {
			endpointId: ctx.socket.header.endpointId,
			serial: ctx.socket.header.serial
		};
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
