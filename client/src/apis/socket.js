define([],
function () {
"use strict";

var Socket = function (opt_baseUri, opt_protocols) {
	this.baseUri = opt_baseUri;
	this.protocols = opt_protocols;

	this.onSocketCreated = null;
	this.onMessage = null;

	// NOTE you can set this property to use sockjs or whatever
	this.customWebSocketClass = null;

	this.socket = null;
	this.requestId = 0;
	this.callbacks = {};
};

Socket.prototype.prefix = '/socket';
Socket.prototype.headerSeparator = '\n\n';

Socket.prototype.getWebSocketClass = function() {
	return this.customWebSocketClass || WebSocket;
};

Socket.prototype.createSocket = function () {
	var uri = this.prefix;
	if (this.baseUri) {
		uri = this.baseUri + uri;
	}

	var WebSocketClass = this.getWebSocketClass();
	return new WebSocketClass(uri, this.protocols);
};

Socket.prototype.connect = function (opt_cb) {
	if (this.socket != null) {
		switch (this.socket.readyState) {
			case 0: // connecting
				if (opt_cb) {
					this.socket.addEventListener('open', function () {
						opt_cb();
					});
				}
				break;
			case 1: // open
				if (opt_cb) {
					opt_cb();
				}
				break;
			default: // closing or closed
				this.socket = null;
		}
	}
	if (this.socket == null) {
		this.socket = this.createSocket();

		if (this.onSocketCreated) {
			this.onSocketCreated(this.socket);
		}

		if (opt_cb) {
			this.socket.addEventListener('open', function () {
				opt_cb();
			});
		}

		var self = this;
		this.socket.addEventListener('message', function (ev) {
			self.handleMessage(ev);
		});
	}
};

Socket.prototype.handleMessage = function (ev) {
	var result = this.parse(ev.data);
	var requestId = (result.headers != null ? result.headers.requestId : null);
	if (requestId != null) {
		var cb = this.callbacks[requestId];
		if (cb) {
			cb(result);
		}
	}
	else if (this.onMessage != null) {
		this.onMessage(result);
	}
};

Socket.prototype.close = function () {
	if (this.socket != null) {
		this.socket.close();
	}
};

Socket.prototype.send = function(path, method, headers, body, opt_options, opt_cb) {
	var self = this;
	this.connect(function () {
		self.sendInternal(path, method, headers, body, opt_options, opt_cb);
	});
};

Socket.prototype.sendInternal = function(path, method, headers, body, opt_options, opt_cb) {
	headers = headers || {};

	headers.method = method;
	headers.path = path;

	if (opt_cb) {
		var requestId = (headers.requestId == null ? ++this.requestId : headers.requestId);
		this.callbacks[requestId] = opt_cb;
		headers.requestId = requestId;
	}

	if (body === undefined) {
		body = '';
	}
	else if (body == null || body.constructor !== String) {
		body = JSON.stringify(body);
	}

	var msg = [
		JSON.stringify(headers),
		body
	].join(this.headerSeparator);

	this.socket.send(msg);
};

Socket.prototype.parse = function(message) {
	var sepPos = message.indexOf(this.headerSeparator);
	var headersStr = message.substring(0, sepPos);
	var body = message.substring(sepPos + this.headerSeparator.length);

	var headers = JSON.parse(headersStr);

	var result = {
		headers: headers,
		data: this.parseBody(body)
	};

	if (headers.status != null) {
		result.status = headers.status;
	}

	return result;
};

Socket.prototype.parseBody = function(body) {
	return JSON.parse(body);
};


return Socket;

});
