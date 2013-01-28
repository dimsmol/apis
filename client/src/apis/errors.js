define(['./inherits', './error_base'],
function (inherits, ErrorBase) {
"use strict";

var WebError = function (result) {
	ErrorBase.call(this);

	this.status = result.status;
	this.transport = result.transport;
	this.haders = result.headers;
	this.data = result.data;
};
inherits(WebError, ErrorBase);

return {
	WebError: WebError
};

});
