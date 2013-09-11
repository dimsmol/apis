"use strict";
var inherits = require('inherits');
var ErrorBase = require('nerr/lib/error_base');
var WebError = require('../node_client/web_error');


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


module.exports = {
	WebError: WebError,
	NetworkError: NetworkError,
	TimeoutError: TimeoutError,
	ConnectionCloseError: ConnectionCloseError
};
