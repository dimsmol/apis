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


var TimeoutError = function () {
	ErrorBase.call(this);
};
inherits(TimeoutError, ErrorBase);

TimeoutError.prototype.name = 'TimeoutError';


var ConnectionCloseError = function (closeEvent) {
	ErrorBase.call(this);
	this.closeEvent = closeEvent;
};
inherits(ConnectionCloseError, ErrorBase);

ConnectionCloseError.prototype.name = 'ConnectionCloseError';

ConnectionCloseError.prototype.getMessage = function () {
	return this.closeEvent.reason;
};


return {
	WebError: WebError,
	NetworkError: NetworkError,
	TimeoutError: TimeoutError,
	ConnectionCloseError: ConnectionCloseError
};

});
