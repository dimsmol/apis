"use strict";
var inherits = require('util').inherits;
var BadRequest = require('./core').BadRequest;


var ValidationError = function (path, code, msg, validatorInfo) {
	BadRequest.call(this);
	this.path = path;
	this.code = code;
	this.msg = msg;
	this.validatorInfo = validatorInfo;
};
inherits(ValidationError, BadRequest);

ValidationError.prototype.name = 'ValidationError';

ValidationError.prototype.getMessage = function () {
	return this.msg;
};

ValidationError.prototype.getDetails = function (isDebug) {
	var result = ValidationError.super_.prototype.getDetails.call(this, isDebug);
	result.code = this.code;
	result.path = this.path;
	var msg = this.getMessage();
	if (msg != null) {
		result.message = msg;
	}
	return result;
};


var MetadataValidationError = function (path, code, msg, validatorInfo) {
	ValidationError.call(this, path, code, msg, validatorInfo);
};
inherits(MetadataValidationError, ValidationError);


module.exports = {
	ValidationError: ValidationError,
	MetadataValidationError: MetadataValidationError
};
