"use strict";
var Transport = function() {
};

Transport.prototype.sendResult = function (webCtx, status, result, opt_headers) {
	var res = webCtx.res;

	res.statusCode = status;

	if (opt_headers != null) {
		for (var k in opt_headers) {
			res.setHeader(k, opt_headers[k]);
		}
	}

	res.json(result);
};


module.exports = Transport;
