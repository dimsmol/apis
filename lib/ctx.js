var Ctx = function (path) {
	this.path = path;

	this.type = null;

	this.web = null;
	this.socket = null;

	this.paths = [];

	this.method = null;

	this.isDone = false;
};

Ctx.prototype.ensureNotInited = function (web) {
	if (this.type != null)
	{
		throw new Error('Already initialized');
	}
};

Ctx.prototype.initWeb = function (web) {
	this.ensureNotInited();

	this.web = web;
	this.type = 'web';
};

Ctx.prototype.initSocket = function (socket) {
	this.ensureNotInited();

	this.socket = socket;
	this.type = 'socket';
};

Ctx.prototype.done = function () {
	this.isDone = true;
};

Ctx.prototype.subPath = function (path) {
	if (!path || this.path.indexOf(path) == 0)
	{
		this.paths.push(this.path);
		if (path)
		{
			this.path = this.path.substring(path.length);
		}
		return true;
	}
	else
	{
		return false;
	}
};

Ctx.prototype.restorePath = function () {
	this.path = this.paths.pop();
};

module.exports = Ctx;
