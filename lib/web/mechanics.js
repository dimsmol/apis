var Ctx = require('../ctx');


var Mechanics = function () {
	this.handler = null;
	this.middleware = this.createMiddleware();
};

Mechanics.prototype.setHandler = function (handler) {
	this.handler = handler;
};

Mechanics.prototype.middlewareHandle = function (req, res, next) {
	if (this.handler == null)
	{
		throw new Error('No handler set');
	}

	var ctx = new Ctx();

	ctx.path = req.path;
	ctx.method = req.method;

	ctx.web = {
		req: req,
		res: res
	};

	this.handler.handle(ctx, next);
};

Mechanics.prototype.createMiddleware = function () {
	var self = this;
	return function (req, res, next) {
		self.middlewareHandle(req, res, next);
	};
};


module.exports = Mechanics;
