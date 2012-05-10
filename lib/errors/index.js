"use strict";
var core = require('./core');
var badRequest = require('./bad_request');


module.exports = {
	WebError: core.WebError,
	BadRequest: core.BadRequest,
	AuthRequired: core.AuthRequired,
	Forbidden: core.Forbidden,
	NotFound: core.NotFound,
	Conflict: core.Conflict,

	MetadataRequired: badRequest.MetadataRequired,
	ValidationError: badRequest.ValidationError
};
