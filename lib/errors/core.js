var inherits = require('util').inherits;

var ErrorBase = function (status) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);

	this.status = status;
};

ErrorBase.prototype.getMessage = function () {
	return this.status + ' Generic Error';
};

ErrorBase.prototype.getDetails = function (isDebug) {
	return {};
};

// NOTE 4XX code always means that
// there is no sence in repeating request -
// it will fail with the same error.
// Error usually must include additional data
// helping the client to preform request correctly.

var BadRequest = function () {
	ErrorBase.call(this, 400);
};
inherits(BadRequest, ErrorBase);

BadRequest.prototype.getMessage = function () {
	return this.status + ' Bad request';
};


var AuthRequired = function () {
	ErrorBase.call(this, 401);
};
inherits(AuthRequired, ErrorBase);

AuthRequired.prototype.getMessage = function () {
	return this.status + ' Authentication required';
};


var Forbidden = function () {
	ErrorBase.call(this, 403);
};
inherits(Forbidden, ErrorBase);

Forbidden.prototype.getMessage = function () {
	return this.status + ' Forbidden';
};


var NotFound = function () {
	ErrorBase.call(this, 404);
};
inherits(NotFound, ErrorBase);

NotFound.prototype.getMessage = function () {
	return this.status + ' Resource not found';
};


var Conflict = function () {
	ErrorBase.call(this, 409);
};
inherits(Conflict, ErrorBase);

Conflict.prototype.getMessage = function () {
	return [
		this.status,
		' Conflict'].join('');
};

// NOTE 500 error can be a temporal problem and
// request should be repeated several times
// in hope it will work.
// Also message can be shown to client only in debug mode,
// be carefull.

var InternalError = function (message) {
	ErrorBase.call(this, 500);
	this.message = message;
};
inherits(InternalError, ErrorBase);

InternalError.prototype.getMessage = function () {
	return this.message;
};

InternalError.prototype.getDetails = function (isDebug) {
	var result = InternalError.super_.prototype.getDetails.call(this);

	if (isDebug)
	{
		result.message = this.message;
	}

	return result;
};


module.exports = {
	ErrorBase: ErrorBase,
	BadRequest: BadRequest,
	AuthRequired: AuthRequired,
	Forbidden: Forbidden,
	NotFound: NotFound,
	Conflict: Conflict,
	InternalError: InternalError
};
