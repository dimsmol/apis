"use strict";
var inherits = require('util').inherits;
var ErrorBase = require('nerr').ErrorBase;


var HttpError = function (status) {
	ErrorBase.call(this);
	this.status = status;
};
inherits(HttpError, ErrorBase);

HttpError.prototype.name = 'HttpError';

HttpError.prototype.getMessage = function () {
	return this.status + ' Generic Error';
};

HttpError.prototype.getDetails = function (isDebug) {
	return {
		_type: this.getType()
	};
};

HttpError.prototype.getType = function () {
	return this.name;
};


// NOTE 4XX code always means that
// there is no sence in repeating request -
// it will fail with the same error.
// Error usually must include additional data
// helping the client to preform request correctly.

var BadRequest = function () {
	HttpError.call(this, 400);
};
inherits(BadRequest, HttpError);

BadRequest.prototype.name = 'BadRequest';

BadRequest.prototype.getMessage = function () {
	return this.status + ' Bad request';
};


var AuthRequired = function () {
	HttpError.call(this, 401);
};
inherits(AuthRequired, HttpError);

AuthRequired.prototype.name = 'AuthRequired';

AuthRequired.prototype.getMessage = function () {
	return this.status + ' Authentication required';
};


var Forbidden = function () {
	HttpError.call(this, 403);
};
inherits(Forbidden, HttpError);

Forbidden.prototype.name = 'Forbidden';

Forbidden.prototype.getMessage = function () {
	return this.status + ' Forbidden';
};


var NotFound = function () {
	HttpError.call(this, 404);
};
inherits(NotFound, HttpError);

NotFound.prototype.name = 'NotFound';

NotFound.prototype.getMessage = function () {
	return this.status + ' Resource not found';
};


var Conflict = function () {
	HttpError.call(this, 409);
};
inherits(Conflict, HttpError);

Conflict.prototype.name = 'Conflict';

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


module.exports = {
	HttpError: HttpError,
	BadRequest: BadRequest,
	AuthRequired: AuthRequired,
	Forbidden: Forbidden,
	NotFound: NotFound,
	Conflict: Conflict
};
