"use strict";
var core = require('./core');
var badRequest = require('./bad_request');


module.exports = {
	ErrorBase: core.ErrorBase,
	BadRequest: core.BadRequest,
	AuthRequired: core.AuthRequired,
	Forbidden: core.Forbidden,
	NotFound: core.NotFound,
	Conflict: core.Conflict,
	InternalError: core.InternalError,

	MetadataRequired: badRequest.MetadataRequired
};
