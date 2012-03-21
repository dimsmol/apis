var errh = function (func, cb) {
	return function (err, result) {
		if (err)
		{
			cb(err);
		}
		else
		{
			func(result, cb);
		}
	};
};


module.exports = {
	errh: errh
};
