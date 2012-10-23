"use strict";
var inherits = require('util').inherits;
var BadRequest = require('./core').BadRequest;


var MessageFormatError = function (msg) {
	BadRequest.call(this, msg);
};
inherits(MessageFormatError, BadRequest);

MessageFormatError.prototype.name = 'MessageFormatError';


var ParseError = function (err) {
	BadRequest.call(this);
	this.err = err;
};
inherits(ParseError, BadRequest);

ParseError.prototype.name = 'ParseError';

ParseError.prototype.getMessage = function () {
	return this.err.message;
};

ParseError.prototype.getDetails = function (isDebug) {
	var result = ParseError.super_.prototype.getDetails.call(this, isDebug);
	var msg = this.getMessage();
	if (msg != null) {
		result.message = msg;
	}
	return result;
};


var HeadersParseError = function (err) {
	ParseError.call(this, err);
};
inherits(HeadersParseError, ParseError);

HeadersParseError.prototype.name = 'HeadersParseError';


var ValidationError = function (path, code, msg, validatorInfo) {
	BadRequest.call(this, msg);
	this.path = path;
	this.code = code;
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
	return result;
};


module.exports = {
	MessageFormatError: MessageFormatError,
	ParseError: ParseError,
	HeadersParseError: HeadersParseError,
	ValidationError: ValidationError
};
