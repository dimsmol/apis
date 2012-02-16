var Handler = function () {
};

Handler.prototype.handle = function (ctx, next) {
	next(ctx);
};

Handler.prototype.setup = function (resource) {
	return true;
};


module.exports = Handler;
