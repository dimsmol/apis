"use strict";
var inherits = require('util').inherits;
var ErrorBase = require('nerr').ErrorBase;


var WebError = function (status) {
	ErrorBase.call(this);
	this.status = status;
};
inherits(WebError, ErrorBase);

WebError.prototype.name = 'WebError';

WebError.prototype.getMessage = function () {
	return this.status + ' Generic Error';
};

WebError.prototype.getDetails = function (isDebug) {
	return {
		_type: this.getType()
	};
};

WebError.prototype.getType = function () {
	return this.name;
};


// NOTE 4XX code always means that
// there is no sence in repeating request -
// it will fail with the same error.
// Error usually must include additional data
// helping the client to preform request correctly.

var BadRequest = function () {
	WebError.call(this, 400);
};
inherits(BadRequest, WebError);

BadRequest.prototype.name = 'BadRequest';

BadRequest.prototype.getMessage = function () {
	return this.status + ' Bad Request';
};


var AuthRequired = function () {
	WebError.call(this, 401);
};
inherits(AuthRequired, WebError);

AuthRequired.prototype.name = 'AuthRequired';

AuthRequired.prototype.getMessage = function () {
	return this.status + ' Authentication Required';
};


var Forbidden = function () {
	WebError.call(this, 403);
};
inherits(Forbidden, WebError);

Forbidden.prototype.name = 'Forbidden';

Forbidden.prototype.getMessage = function () {
	return this.status + ' Forbidden';
};


var NotFound = function () {
	WebError.call(this, 404);
};
inherits(NotFound, WebError);

NotFound.prototype.name = 'NotFound';

NotFound.prototype.getMessage = function () {
	return this.status + ' Not Found';
};


var MethodNotAllowed = function (allowedMethods, httpAllowedMethods) {
	WebError.call(this, 405);
	this.allowedMethods = allowedMethods;
	this.httpAllowedMethods = httpAllowedMethods;
};
inherits(MethodNotAllowed, WebError);

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
	WebError.call(this, 409);
};
inherits(Conflict, WebError);

Conflict.prototype.name = 'Conflict';

Conflict.prototype.getMessage = function () {
	return this.status + ' Conflict';
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
	Conflict: Conflict
};
