"use strict";
var inherits = require('util').inherits;
var mt = require('marked_types');
var ErrorBase = require('nerr').ErrorBase;
var valid = require('valid');
var errors = require('../errors');
var isSuccess = require('../tools/http').isSuccess;
var ValidatingHandler = require('./core/validating_handler');

var WebError = errors.WebError;
var ServerError = errors.ServerError;

var validators = valid.validators;
var any = validators.any;
var isNull = validators.isNull;


var ResultValidationError = function (path, errorInfo, dataInfo) {
	ErrorBase.call(this);

	this.path = path;
	this.errorInfo = errorInfo;
	this.dataInfo = dataInfo;
};
inherits(ResultValidationError, ErrorBase);

ResultValidationError.prototype.name = 'ResultValidationError';

ResultValidationError.prototype.getMessage = function () {
	var result = [
		'Result validation error for path "',
		this.path,
		'": ',
		this.errorInfo.message
	];
	if (this.dataInfo !== undefined) {
		result.push('\nData: ');
		result.push(this.dataInfo);
	}

	return result.join('');
};


var Result = function (dataSpec) {
	ValidatingHandler.call(this, dataSpec);
};
inherits(Result, ValidatingHandler);

Result.prototype.name = 'Result';

Result.prototype.handleRequest = function (ctx) {
	if (ctx.isResponseSent) {
		ctx.error(new Error('Attempt to send response more than once'));
	}
	else {
		var result = ctx.getResult();
		var err;
		if (this.needValidateResult(ctx)) {
			err = this.validate(ctx, result);
		}
		if (err == null) {
			var status = ctx.res.statusCode;
			if (status == null) {
				ctx.res.statusCode = (result === undefined ? 204 : 200);
			}
			else if (status == 204 && result !== undefined) {
				err = new Error('Got 204 with non-empty result');
			}
		}
		if (err != null) {
			this.handleErrorInternal(ctx, err);
		}
		else {
			this.respond(ctx, result);
		}
	}
};

Result.prototype.validate = function (ctx, data) {
	return this.validateInternal(ctx, data, {
		debug: ctx.isDebug,
		errors: { needMessage: true },
		warnings: { needMessage: true }
	});
};

Result.prototype.needValidateResult = function (ctx) {
	var validateResult = ctx.appSettings.core.handlers.result.validateResult;
	return validateResult == 'debug' ? ctx.isDebug : validateResult;
};

Result.prototype.needLogWithData = function (ctx) {
	return ctx.appSettings.core.handlers.result.logWithData;
};

Result.prototype.createValidationError = function (ctx, validationCtx, data) {
	var errorInfo = validationCtx.getError();
	var dataInfo;
	if (this.needLogWithData(ctx)) {
		dataInfo = this.prepareDataForLogging(data);
	}
	return new ResultValidationError(ctx.req.path, errorInfo, dataInfo);
};

Result.prototype.handleError = function (ctx) {
	var err = ctx.getError();
	this.handleErrorInternal(ctx, err);
};

Result.prototype.handleErrorInternal = function (ctx, err) {
	ctx.logError(err);

	if (ctx.isResponseSent) {
		ctx.error(new Error('Attempt to send response more than once'));
	}
	else {
		this.sendError(ctx, err);
	}
};

Result.prototype.sendError = function (ctx, err) {
	var status = 500;
	var result;
	var isDebug = ctx.isDebug;
	var provideStackTrace = ctx.appSettings.core.handlers.result.provideStackTrace;
	var needStack = provideStackTrace == 'debug' ? isDebug : provideStackTrace;

	if (!mt.is(err, WebError)) {
		err = new ServerError(err);
	}

	if (err.status != null && !isSuccess(err.status)) {
		status = err.status;
	}
	else {
		try {
			ctx.logError(new Error([
				'Incorrect error status "', err.status+'',
				'" for error "', err.name, '"'].join('')));
		}
		catch (exc) {
			ctx.logError(exc, 'critical');
		}
	}

	result = err.getDetails(isDebug);

	if (isDebug) {
		// just for convenience
		result.message = err.message;
	}

	// must set Allowed header for '405 Method not allowed' response
	// according to HTTP specs
	if (status == 405 && err.httpAllowedMethods != null && err.httpAllowedMethods.length > 0 && ctx.isHttp) {
		ctx.res.setHeader('Allow', err.httpAllowedMethods.join(', '));
	}

	if (needStack) {
		result.stack = err.stack;
	}

	ctx.clearError();
	ctx.res.statusCode = status;
	this.respond(ctx, result);
};

Result.prototype.respond = function (ctx, result) {
	ctx.sendResult(result);
	ctx.responseSent();
	ctx.next();
};

Result.result = function (dataSpec) {
	return new Result(dataSpec);
};

Object.defineProperties(Result.result, {
	any: {
		get: function () {
			return Result.result(any);
		}
	},
	none: {
		get: function () {
			return Result.result(isNull);
		}
	}
});

Result.ResultValidationError = ResultValidationError;


module.exports = Result;
