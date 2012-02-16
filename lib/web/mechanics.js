var Ctx = require('../ctx');


var Mechanics = function (path) {
	this.path = path;

	this.handler = null;
	this.middleware = this.createMiddleware();
};

Mechanics.prototype.setHandler = function (handler) {
	this.handler = handler;
};

Mechanics.prototype.middlewareHandle = function (req, res, next) {
	var ctx = new Ctx(req.path);

	if (!ctx.subPath(this.path))
	{
		next();
		return;
	}


	if (this.handler == null)
	{
		throw new Error('No handler set');
	}

	ctx.origPath = req.path;
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
