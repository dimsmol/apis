define(['./inherits', './error_base'],
function (inherits, ErrorBase) {
"use strict";

var WebError = function (response) {
	ErrorBase.call(this);

	this.response = response;

	this.status = response.status;
	var data = response.data || {};
	this._message = data.message;
	this.status = response.status;
	this.code = data.code;
};
inherits(WebError, ErrorBase);

WebError.prototype.name = 'WebError';

WebError.prototype.getMessage = function () {
	return this._message;
};


var NetworkError = function () {
	ErrorBase.call(this);
};
inherits(NetworkError, ErrorBase);

NetworkError.prototype.name = 'NetworkError';


return {
	WebError: WebError,
	NetworkError: NetworkError
};

});
