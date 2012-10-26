"use strict";
var util = require('util');
var inherits = util.inherits;
var Handler = require('./handler');
var valid = require('valid');
var ValidationError = require('../../errors').ValidationError;

var validate = valid.validate;
var spec = valid.validators.spec;


var ValidatingHandler = function (dataSpec) {
	Handler.call(this);
	this.dataSpec = spec(dataSpec);
};
inherits(ValidatingHandler, Handler);

ValidatingHandler.prototype.name = 'ValidatingHandler';

ValidatingHandler.prototype.getValidationScope = function () {
	return this.name;
};

ValidatingHandler.prototype.validate = function (ctx, data) {
	var isDebug = ctx.isDebug;
	return this.validateInternal(ctx, data, {
		debug: isDebug,
		errors: {
			needMessage: true,
			needValidatorInfo: ctx.appSettings.core.handlers.data.needValidatorInfo },
		warnings: { needMessage: true }
	});
};

ValidatingHandler.prototype.validateInternal = function (ctx, data, opt_options) {
	var validationCtx = validate(data, this.dataSpec, opt_options);
	if (validationCtx.hasWarnings()) {
		this.reportValidationWarnings(ctx, validationCtx, data);
	}
	var result;
	if (validationCtx.hasErrors()) {
		result = this.createValidationError(ctx, validationCtx);
	}
	return result;
};

ValidatingHandler.prototype.reportValidationWarnings = function (ctx, validationCtx) {
	var result = [
		this.getValidationScope(),
		' validation warnings for path "',
		ctx.req.path,
		'": ',
		JSON.stringify(validationCtx.warnings)];
	if (this.needLogWithData(ctx)) {
		result.push('\nData: ');
		result.push(this.prepareDataForLogging(ctx.data));
	}
	ctx.logger.warning(result.join(''));
};

ValidatingHandler.prototype.needLogWithData = function (ctx) {
	return ctx.appSettings.core.handlers.data.logWithData;
};

ValidatingHandler.prototype.prepareDataForLogging = function (data) {
	return util.inspect(data, false, null);
};

ValidatingHandler.prototype.createValidationError = function (ctx, validationCtx) {
	var errorInfo = validationCtx.getError();
	var result = new ValidationError(
		errorInfo.path,
		errorInfo.code,
		errorInfo.message,
		errorInfo.validatorInfo
	);
	return result;
};


module.exports = ValidatingHandler;
