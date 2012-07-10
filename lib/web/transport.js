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

	// NOTE returning dictionary, because sometimes
	// we need to include header in response (for JSONP)
	// or some additional data (to do less requests)
	// or something like that
	res.json({ data: result });
};


module.exports = Transport;
