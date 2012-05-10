"use strict";
var inherits = require('util').inherits;
var BadRequest = require('./core').BadRequest;


var MetadataRequired = function (dataName) {
	BadRequest.call(this);
	this.dataName = dataName;
};
inherits(MetadataRequired, BadRequest);

MetadataRequired.prototype.name = 'MetadataRequired';

MetadataRequired.prototype.getMessage = function () {
	return [this.dataName, ' required in metadata'].join('');
};

MetadataRequired.prototype.getDetails = function (isDebug) {
	var result = MetadataRequired.super_.prototype.getDetails.call(this, isDebug);
	result.dataName = this.dataName;
	return result;
};


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
	var result = MetadataRequired.super_.prototype.getDetails.call(this, isDebug);
	result.code = this.code;
	result.path = this.path;
	if (this.validatorInfo != null) {
		result.validatorInfo = this.validatorInfo;
	}
	return result;
};


module.exports = {
	MetadataRequired: MetadataRequired,
	ValidationError: ValidationError
};
