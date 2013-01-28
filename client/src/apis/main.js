define(['./inherits', './error_base', './errors', './http', './http_request', './jsonp_request', './socket'],
function (inherits, ErrorBase, errors, Http, HttpRequest, JsonpRequest, Socket) {
"use strict";

return {
	inherits: inherits,
	ErrorBase: ErrorBase,
	errors: errors,
	Http: Http,
	HttpRequest: HttpRequest,
	JsonpRequest: JsonpRequest,
	Socket: Socket
};

});
