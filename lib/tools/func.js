var errh = function (func, cb) {
	return function (err, rest) {
		if (err)
		{
			cb(err);
		}
		else
		{
			if (arguments.length > 2)
			{
				var args = Array.prototype.slice.call(arguments, 1);
				args.push(cb);
				func.apply(null, args);
			}
			else
			{
				func(rest, cb);
			}
		}
	};
};


module.exports = {
	errh: errh
};
