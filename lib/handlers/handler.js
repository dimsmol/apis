var Handler = function () {
};

Handler.prototype.handle = function (ctx) {
	ctx.next();
};

Handler.prototype.setup = function (chain) {
};


module.exports = Handler;
