"use strict";
var inherits = require('util').inherits;
var ErrorBase = require('nerr').ErrorBase;
var errors = require('../errors');
var isSuccess = require('../tools/http').isSuccess;
var ValidatingHandler = require('./core/validating_handler');
var WebError = errors.WebError;


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
		var error;
		if (this.needValidateResult(ctx)) {
			error = this.validate(ctx, result);
		}
		if (error != null) {
			this.handleErrorInternal(ctx, error);
		}
		else {
			var status = ctx.res.statusCode;
			if (status == null) {
				ctx.res.statusCode = (result === undefined ? 204 : 200);
			}
			else if (status == 204 && result !== undefined) {
				throw new Error("Got 204 with non-empty result");
			}
			this.respond(ctx, result);
		}
	}
};

Result.prototype.validate = function (ctx, data) {
	return this.validateInternal(ctx, data, {
		debug: ctx.isDebug(),
		errors: { needMessage: true },
		warnings: { needMessage: true }
	});
};

Result.prototype.needValidateResult = function (ctx) {
	var validateResult = ctx.appSettings.core.handlers.result.validateResult;
	return validateResult == 'debug' ? ctx.isDebug() : validateResult;
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
	return new ResultValidationError(ctx.origPath, errorInfo, dataInfo);
};

Result.prototype.handleError = function (ctx) {
	var error = ctx.getError();
	this.handleErrorInternal(ctx, error);
};

Result.prototype.handleErrorInternal = function (ctx, error) {
	ctx.logError(error);

	if (ctx.isResponseSent) {
		ctx.error(new Error('Attempt to send response more than once'));
	}
	else {
		this.sendError(ctx, error);
	}
};

Result.prototype.sendError = function (ctx, error) {
	var status = 500;
	var result;
	var isDebug = ctx.isDebug();
	var provideStackTrace = ctx.appSettings.core.handlers.result.provideStackTrace;
	var needStack = provideStackTrace == 'debug' ? isDebug : provideStackTrace;

	if (error instanceof WebError) {
		if (error.status != null && !isSuccess(error.status)) {
			status = error.status;
		}
		else {
			try {
				ctx.logError(new Error([
					'Incorrect error status "', error.status+'' ,
					'" for error "', error.name, '"'].join('')));
			}
			catch (exc) {
				ctx.logError(exc);
			}
		}

		result = error.getDetails(isDebug);

		if (isDebug) {
			// just for convenience
			result.message = error.message;
		}

		if (status < 500 || status >= 600) {
			// don't provide stack for non-server errors
			needStack = false;
		}

		// must set Allowed header for '405 Method not allowed' response
		// according to HTTP specs
		if (status == 405 && error.httpAllowedMethods != null && error.httpAllowedMethods.length > 0 && ctx.isHttp) {
			ctx.res.setHeader('Allow', error.httpAllowedMethods.join(', '));
		}
	}
	else {
		if (isDebug) {
			result = {
				message: error.message
			};
		}
		else {
			result = {
				message: 'Internal server error'
			};
		}
	}

	if (needStack) {
		result.stack = error.stack;
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

Result.ResultValidationError = ResultValidationError;


module.exports = Result;
