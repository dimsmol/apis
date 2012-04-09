"use strict";
var inherits = require('util').inherits;
var errors = require('../errors');
var Handler = require('./handler');
var WebError = errors.WebError;


var Result = function (dataSpec) {
};
inherits(Result, Handler);

Result.prototype.name = 'Result';

Result.prototype.handleRequest = function (ctx) {
	if (ctx.isResponseSent)
	{
		ctx.error(new Error('Attempt to send response more than once'));
	}
	else
	{
		this.respond(ctx, 200, ctx.getResult());
	}
};

Result.prototype.handleError = function (ctx) {
	var error = ctx.getError();

	ctx.logError(error);

	if (ctx.isResponseSent)
	{
		ctx.error(new Error('Attempt to send response more than once'));
	}
	else
	{
		this.handleErrorInternal(ctx, error);
	}
};

Result.prototype.handleErrorInternal = function (ctx, error) {
	var status = 500;
	var result;
	var isDebug = ctx.isDebug();
	var needStack = isDebug;

	if (error instanceof WebError)
	{
		if (error.status != null && error.status != 200)
		{
			status = error.status;
		}
		else
		{
			try
			{
				ctx.logError(new Error([
					'Incorrect error status "', error.status+'' ,
					'" for error "', error.name, '"'].join('')));
			}
			catch (exc)
			{
				ctx.logError(exc);
			}
		}

		result = error.getDetails(isDebug);

		if (isDebug)
		{
			// just for convenience
			result.message = error.message;
		}

		if (status < 500 || status >= 600)
		{
			// don't provide stack for non-server errors
			needStack = false;
		}
	}
	else
	{
		if (isDebug)
		{
			result = {
				message: error.message
			};

			for (var k in error)
			{
				result[k] = error[k];
			}
		}
		else
		{
			result = {
				message: 'Internal server error'
			};
		}
	}

	if (needStack)
	{
		result.stack = error.stack;
	}

	ctx.clearError();
	this.respond(ctx, status, result);
};

Result.prototype.respond = function (ctx, status, result) {
	var ok = true;

	if (ctx.type == 'web')
	{
		var webCtx = ctx.web;
		webCtx.transport.sendResult(webCtx, status, result);
	}
	else if(ctx.type == 'socket')
	{
		var socketCtx = ctx.socket;
		socketCtx.transport.sendResult(socketCtx, status, result);
	}
	else
	{
		ok = false;
		ctx.error(new Error('Unsupported context type "' + ctx.type + '"'));
	}

	if (ok)
	{
		ctx.responseSent();
		ctx.next();
	}
};

Result.result = function (dataSpec) {
	return new Result(dataSpec);
};


module.exports = Result;
