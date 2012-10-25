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
