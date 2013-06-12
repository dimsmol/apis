"use strict";
var errors = require('./errors');
var Authenticator = require('./authenticator');


var Socket = function (opt_basePath, opt_socketUri, opt_protocols) {
	this.basePath = opt_basePath;
	this.socketUri = opt_socketUri || this.defaultSocketUri;
	this.protocols = opt_protocols;

	this.onSocketCreated = null;
	this.onMessage = null;

	this.webSocketClass = WebSocket;
	this.authenticator = null;

	this.socket = null;
	this.requests = {};

	this.abortFunc = this.createAbortFunc();
};

Socket.prototype.defaultSocketUri = '/socket';
Socket.prototype.headerSeparator = '\n\n';
Socket.prototype.defaultTimeout = null;

Socket.prototype.setWebSocketClass = function (c) {
	this.webSocketClass = c;
};

Socket.prototype.setAuthenticator = function (authenticator) {
	this.authenticator = authenticator;
};

Socket.prototype.setAuth = function (auth) {
	this.ensureAuthenticator();
	this.authenticator.setAuth(auth);
};

Socket.prototype.ensureAuthenticator = function () {
	if (this.authenticator == null) {
		this.authenticator = this.createAuthenticator();
	}
};

Socket.prototype.createAuthenticator = function () {
	return new Authenticator();
};

Socket.prototype.createAbortFunc = function () {
	var self = this;
	return function () {
		self.handleAbort(this);
	};
};

Socket.prototype.createSocket = function () {
	var WebSocketClass = this.webSocketClass;
	return new WebSocketClass(this.socketUri, this.protocols);
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

		this.socket.addEventListener('close', function (ev) {
			self.handleClose(ev);
		});
	}
};

Socket.prototype.handleMessage = function (ev) {
	var result = this.parse(ev.data);
	var requestId = (result.headers != null ? result.headers.requestId : null);
	if (requestId != null) {
		var request = this.requests[requestId];
		if (request) {
			var cb = request.cb;
			this.clearRequest(request, requestId);
			var err = errors.WebError.extract(result);
			if (err != null) {
				cb(err);
			}
			else {
				cb(null, result);
			}
		}
	}
	else if (this.onMessage != null) {
		this.onMessage(result);
	}
};

Socket.prototype.createRequestId = function () {
	var base = '' + (new Date().getTime());
	var i = 0;
	var result = base;
	while (result in this.requests) {
		result = base + '_' + (i++);
	}
	return result;
};

Socket.prototype.clearRequest = function (request) {
	delete this.requests[request.id];
	var timeout = request.timeout;
	if (timeout != null) {
		clearTimeout(timeout);
	}
};

Socket.prototype.close = function () {
	if (this.socket != null) {
		this.socket.close();
	}
};

Socket.prototype.sendAuthenticated = function (path, method, headers, data, opt_options, opt_cb) {
	this.authenticator.sendAuthenticated(this, path, method, headers, data, opt_options, opt_cb);
};

Socket.prototype.sendAuthenticatedIfPossible = function (path, method, headers, data, opt_options, opt_cb) {
	this.ensureAuthenticator();
	if (this.authenticator.canAuthenticate()) {
		this.sendAuthenticated(path, method, headers, data, opt_options, opt_cb);
	}
	else {
		this.send(path, method, headers, data, opt_options, opt_cb);
	}
};

Socket.prototype.send = function (path, method, headers, data, opt_options, opt_cb) {
	var self = this;
	this.connect(function () {
		self.sendInternal(path, method, headers, data, opt_options, opt_cb);
	});
};

Socket.prototype.sendInternal = function (path, method, headers, data, opt_options, opt_cb) {
	headers = headers || {};

	headers.method = method;
	headers.path = this.getEffectivePath(path);

	var request;
	if (opt_cb) {
		request = this.createRequest(opt_options, opt_cb);
		headers.requestId = request.id;
	}

	var body;
	if (data === undefined) {
		body = '';
	}
	else {
		body = JSON.stringify(data);
	}

	var msg = [
		JSON.stringify(headers),
		body
	].join(this.headerSeparator);

	this.socket.send(msg);
	return request;
};

Socket.prototype.getEffectivePath = function (path) {
	var result = path;
	if (this.basePath) {
		result = this.basePath + path;
	}
	return result;
};

Socket.prototype.createRequest = function (options, cb) {
	var requestId = this.createRequestId();
	var request = {
		id: requestId,
		cb: cb,
		options: options,
		abort: this.abortFunc
	};
	request.timeout = this.createTimeout(request);
	this.requests[requestId] = request;
	return request;
};

Socket.prototype.createTimeout = function (request) {
	var options = request.options;
	var result = null;
	var timeout = (options != null && options.timeout != null ? options.timeout : this.defaultTimeout);
	if (timeout != null) {
		var self = this;
		result = setTimeout(function () {
			self.handleTimeout(request);
		}, timeout);
	}
	return result;
};

Socket.prototype.handleTimeout = function (request) {
	var cb = request.cb;
	this.clearRequest(request);
	cb(new errors.TimeoutError());
};

Socket.prototype.handleAbort = function (request) {
	this.clearRequest(request);
};

Socket.prototype.handleClose = function (ev) {
	for (var k in this.requests) {
		var request = this.requests[k];
		var cb = request.cb;
		this.clearRequest(request);
		cb(new errors.ConnectionCloseError(ev));
	}
};

Socket.prototype.parse = function (message) {
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

Socket.prototype.parseBody = function (body) {
	var result;
	if (body) {
		result = JSON.parse(body);
	}
	return result;
};


module.exports = Socket;
