"use strict";
var core = require('./core');
var badRequest = require('./bad_request');


module.exports = {
	WebError: core.WebError,
	BadRequest: core.BadRequest,
	AuthRequired: core.AuthRequired,
	Forbidden: core.Forbidden,
	NotFound: core.NotFound,
	MethodNotAllowed: core.MethodNotAllowed,
	Conflict: core.Conflict,
	RequestEntityTooLarge: core.RequestEntityTooLarge,
	UnsupportedMediaType: core.UnsupportedMediaType,
	ServerError: core.ServerError,

	MessageFormatError: badRequest.MessageFormatError,
	ParseError: badRequest.ParseError,
	HeadersParseError: badRequest.HeadersParseError,
	ValidationError: badRequest.ValidationError
};
