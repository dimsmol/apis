var Transport = function() {
};

Transport.prototype.sendResult = function (webCtx, status, result) {
	var res = webCtx.res;

	res.statusCode = status;

	// NOTE returning dictionary, because sometimes
	// we need to include header in response (for JSONP)
	// or some additional data (to do less requests)
	// or something like that
	res.send({data: result});
};


module.exports = Transport;
