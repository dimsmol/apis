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
	UnsupportedMediaType: core.UnsupportedMediaType,

	ParseError: badRequest.ParseError,
	HeadersParseError: badRequest.HeadersParseError,
	ValidationError: badRequest.ValidationError
};
