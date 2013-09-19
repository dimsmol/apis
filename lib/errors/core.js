"use strict";
var inherits = require('util').inherits;
var mt = require('marked_types');
var ErrorBase = require('nerr').ErrorBase;


var WebError = function () {
	ErrorBase.call(this);
	this.isLogged = false;
};
inherits(WebError, ErrorBase);
mt.mark(WebError, 'apis:WebError');

WebError.prototype.status = null;
WebError.prototype.name = 'WebError';

WebError.prototype.getMessage = function () {
	return this.status + ' ' + this.name;
};

WebError.prototype.getDetails = function (isDebug) {
	return {
		code: this.getCode()
	};
};

WebError.prototype.getCode = function () {
	return this.name;
};

Object.defineProperties(WebError.prototype, {
	isClientError: {
		get: function () {
			return this.status >= 400 && this.status < 500;
		}
	},
	isServerError: {
		get: function () {
			return this.status >= 500 && this.status < 600;
		}
	}
});

// deprecated and will be removed in next version, use marked types directly instead
WebError.isWebError = function (err, opt_status) {
	return mt.is(err, WebError) && (opt_status == null || err.status == opt_status);
};


// NOTE 4XX code always means that
// there is no sence in repeating request -
// it will fail with the same error.
// Error usually must include additional data
// helping the client to preform request correctly.

var BadRequest = function (opt_msg) {
	WebError.call(this);
	this.msg = opt_msg;
};
inherits(BadRequest, WebError);

BadRequest.prototype.status = 400;
BadRequest.prototype.name = 'BadRequest';

BadRequest.prototype.getMessage = function () {
	var result;
	if (this.msg) {
		result = this.msg;
	}
	else {
		result = BadRequest.super_.prototype.getMessage.call(this);
	}
	return result;
};

BadRequest.prototype.getDetails = function (isDebug) {
	var result = BadRequest.super_.prototype.getDetails.call(this, isDebug);
	var msg = this.getMessage();
	if (msg != null) {
		result.message = msg;
	}
	return result;
};


var AuthRequired = function () {
	WebError.call(this);
};
inherits(AuthRequired, WebError);

AuthRequired.prototype.status = 401;
AuthRequired.prototype.name = 'AuthRequired';


var Forbidden = function () {
	WebError.call(this);
};
inherits(Forbidden, WebError);

Forbidden.prototype.status = 403;
Forbidden.prototype.name = 'Forbidden';


var NotFound = function () {
	WebError.call(this);
};
inherits(NotFound, WebError);

NotFound.prototype.status = 404;
NotFound.prototype.name = 'NotFound';


var MethodNotAllowed = function (allowedMethods, httpAllowedMethods) {
	WebError.call(this);
	this.allowedMethods = allowedMethods;
	this.httpAllowedMethods = httpAllowedMethods;
};
inherits(MethodNotAllowed, WebError);

MethodNotAllowed.prototype.status = 405;
MethodNotAllowed.prototype.name = 'MethodNotAllowed';

MethodNotAllowed.prototype.getDetails = function (isDebug) {
	var result = MethodNotAllowed.super_.prototype.getDetails.call(this, isDebug);
	result.allowedMethods = this.allowedMethods;
	return result;
};


var Conflict = function (opt_msg) {
	WebError.call(this);
	this.msg = opt_msg;
};
inherits(Conflict, WebError);

Conflict.prototype.status = 409;
Conflict.prototype.name = 'Conflict';

Conflict.prototype.getMessage = function () {
	var result;
	if (this.msg) {
		result = this.msg;
	}
	else {
		result = Conflict.super_.prototype.getMessage.call(this);
	}
	return result;
};


var RequestEntityTooLarge = function (opt_maxSize) {
	WebError.call(this);
	this.maxSize = opt_maxSize;
};
inherits(RequestEntityTooLarge, WebError);

RequestEntityTooLarge.prototype.status = 413;
RequestEntityTooLarge.prototype.name = 'RequestEntityTooLarge';

RequestEntityTooLarge.prototype.getDetails = function (isDebug) {
	var result = RequestEntityTooLarge.super_.prototype.getDetails.call(this, isDebug);
	if (this.maxSize != null) {
		result.maxSize = this.maxSize;
	}
	return result;
};


var UnsupportedMediaType = function (opt_supportedMediaTypes) {
	WebError.call(this);
	this.supportedMediaTypes = opt_supportedMediaTypes;
};
inherits(UnsupportedMediaType, WebError);

UnsupportedMediaType.prototype.status = 415;
UnsupportedMediaType.prototype.name = 'UnsupportedMediaType';

UnsupportedMediaType.prototype.getDetails = function (isDebug) {
	var result = UnsupportedMediaType.super_.prototype.getDetails.call(this, isDebug);
	if (this.supportedMediaTypes != null) {
		result.supportedMediaTypes = this.supportedMediaTypes;
	}
	return result;
};


var RequestedRangeNotSatisfiable = function () {
	WebError.call(this);
};
inherits(RequestedRangeNotSatisfiable, WebError);

RequestedRangeNotSatisfiable.prototype.status = 416;
RequestedRangeNotSatisfiable.prototype.name = 'RequestedRangeNotSatisfiable';


// NOTE 500 error can be a temporal problem and
// request should be repeated several times in hope it will work
var ServerError = function (opt_err) {
	WebError.call(this);
	this.err = opt_err;
};
inherits(ServerError, WebError);

ServerError.prototype.status = 500;
ServerError.prototype.name = 'ServerError';

ServerError.prototype.getMessage = function () {
	return this.err ? this.err.message : ServerError.super_.prototype.getMessage.call(this);
};

ServerError.prototype.getStackTrace = function () {
	var result;
	if (this.err != null) {
		result = this.name + ': ' + this.err.stack;
	} else {
		result = this.super_.prototype.getStackTrace.call(this);
	}
	return result;
};

ServerError.prototype.toString = function () {
	var result;
	if (this.err != null) {
		result = this.name + ': ' + this.err.toString();
	} else {
		result = this.super_.prototype.toString.call(this);
	}
	return result;
};


module.exports = {
	WebError: WebError,
	BadRequest: BadRequest,
	AuthRequired: AuthRequired,
	Forbidden: Forbidden,
	NotFound: NotFound,
	MethodNotAllowed: MethodNotAllowed,
	Conflict: Conflict,
	RequestEntityTooLarge: RequestEntityTooLarge,
	UnsupportedMediaType: UnsupportedMediaType,
	ServerError: ServerError
};
