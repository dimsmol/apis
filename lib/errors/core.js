"use strict";
var inherits = require('util').inherits;
var ErrorBase = require('nerr').ErrorBase;


var WebError = function () {
	ErrorBase.call(this);
};
inherits(WebError, ErrorBase);

WebError.prototype.status = null;
WebError.prototype.name = 'WebError';

WebError.prototype.getMessage = function () {
	return this.status + ' Generic Error';
};

WebError.prototype.getDetails = function (isDebug) {
	return {
		type: this.getType()
	};
};

WebError.prototype.getType = function () {
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

WebError.isWebError = function (err, opt_status) {
	return err instanceof WebError && (opt_status == null || err.status == opt_status);
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
		result = this.status + ' Bad Request';
	}
	return result;
};


var AuthRequired = function () {
	WebError.call(this);
};
inherits(AuthRequired, WebError);

AuthRequired.prototype.status = 401;
AuthRequired.prototype.name = 'AuthRequired';

AuthRequired.prototype.getMessage = function () {
	return this.status + ' Authentication Required';
};


var Forbidden = function () {
	WebError.call(this);
};
inherits(Forbidden, WebError);

Forbidden.prototype.status = 403;
Forbidden.prototype.name = 'Forbidden';

Forbidden.prototype.getMessage = function () {
	return this.status + ' Forbidden';
};


var NotFound = function () {
	WebError.call(this);
};
inherits(NotFound, WebError);

NotFound.prototype.status = 404;
NotFound.prototype.name = 'NotFound';

NotFound.prototype.getMessage = function () {
	return this.status + ' Not Found';
};


var MethodNotAllowed = function (allowedMethods, httpAllowedMethods) {
	WebError.call(this);
	this.allowedMethods = allowedMethods;
	this.httpAllowedMethods = httpAllowedMethods;
};
inherits(MethodNotAllowed, WebError);

MethodNotAllowed.prototype.status = 405;
MethodNotAllowed.prototype.name = 'MethodNotAllowed';

MethodNotAllowed.prototype.getMessage = function () {
	return this.status + ' Method Not Allowed';
};

MethodNotAllowed.prototype.getDetails = function (isDebug) {
	var result = MethodNotAllowed.super_.prototype.getDetails.call(this, isDebug);
	result.allowedMethods = this.allowedMethods;
	return result;
};


var Conflict = function () {
	WebError.call(this);
};
inherits(Conflict, WebError);

Conflict.prototype.status = 409;
Conflict.prototype.name = 'Conflict';

Conflict.prototype.getMessage = function () {
	return this.status + ' Conflict';
};


var RequestEntityTooLarge = function (opt_maxSize) {
	WebError.call(this);
	this.maxSize = opt_maxSize;
};
inherits(RequestEntityTooLarge, WebError);

RequestEntityTooLarge.prototype.status = 413;
RequestEntityTooLarge.prototype.name = 'RequestEntityTooLarge';

RequestEntityTooLarge.prototype.getMessage = function () {
	return this.status + ' Request Entity Too Large';
};

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

UnsupportedMediaType.prototype.getMessage = function () {
	return this.status + ' Unsupported Media Type';
};

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

RequestedRangeNotSatisfiable.prototype.getMessage = function () {
	return this.status + ' Requested Range Not Satisfiable';
};


// NOTE 500 error can be a temporal problem and
// request should be repeated several times
// in hope it will work.
// Also message can be shown to client only in debug mode,
// be carefull.


module.exports = {
	WebError: WebError,
	BadRequest: BadRequest,
	AuthRequired: AuthRequired,
	Forbidden: Forbidden,
	NotFound: NotFound,
	MethodNotAllowed: MethodNotAllowed,
	Conflict: Conflict,
	RequestEntityTooLarge: RequestEntityTooLarge,
	UnsupportedMediaType: UnsupportedMediaType
};
