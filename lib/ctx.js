var Ctx = function () {
	this.web = null;
	this.socket = null;

	this.path = null;
	this.method = null;

	this.isProcessed = false;
};

Ctx.prototype.processed = function () {
	this.isProcessed = true;
};


module.exports = Ctx;
