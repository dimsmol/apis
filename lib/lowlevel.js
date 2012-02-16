var Lowlevel = function (config) {
	this.config = config;

	this.webServer = null;
	this.web = null;

	this.socketServer = null;
	this.socket = null;
};

Lowlevel.prototype.init = function () {
	var express = this.config.lib.express;
	var sockjs = this.config.lib.sockjs;

	var settings = this.config.settings;

	this.webServer = express.createServer();
	this.web = this.config.web.configure(this.webServer, settings);

	if (settings.socket && !settings.socket.disable)
	{
		this.socketServer = sockjs.createServer({
			prefix: settings.getSocketPrefix()
		});
		this.socket = this.config.socket.configure(this.socketServer, settings);

		this.socketServer.installHandlers(this.webServer);
	}
};

Lowlevel.prototype.setHandler = function (handler) {
	this.web.setHandler(handler);
	if (this.socket != null)
	{
		this.socket.setHandler(handler);
	}
};

Lowlevel.prototype.start = function () {
	var listenSettings = this.config.settings.listen;
	this.webServer.listen(listenSettings.port, listenSettings.address);
};


module.exports = Lowlevel;
