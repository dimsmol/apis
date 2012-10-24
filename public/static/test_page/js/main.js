(function () {
"use strict";

var apis = window.apis || {};
window.apis = apis;


var Socket = function (onConnectFunc, onMessageFunc, onCloseFunc) {
	this.onConnectFunc = onConnectFunc;
	this.onMessageFunc = onMessageFunc;
	this.onCloseFunc = onCloseFunc;

	this.base = null;
	this.conn = null;
	this.socketPrefix = '/socket';
	this.headerSeparator = '\n\n';
	this.requestId = 0;
};

Socket.prototype.ensureConnected = function(base, cb) {
	if (this.conn == null || this.base != base) {
		this.connect(base, function (conn) {
			cb(conn);
		});
	}
	else {
		cb(this.conn);
	}
};

Socket.prototype.connect = function(base, opt_cb) {
	this.close();

	this.base = base || '';
	this.conn = new SockJS(this.base + this.socketPrefix);
	var self = this;

	this.conn.onopen = function() {
		self.onConnectFunc(self.conn);
		if (opt_cb) {
			opt_cb(self.conn);
		}
	};

	this.conn.onmessage = function(e) {
		var data = self.decode(e.data);
		self.onMessageFunc(e, data);
	};

	this.conn.onclose = function(e) {
		self.onCloseFunc(e);
	};
};

Socket.prototype.close = function () {
	if (this.conn != null) {
		this.conn.close();
		this.conn = null;
	}
};

Socket.prototype.send = function(headers, body) {
	headers = headers || {};
	headers.requestId = (headers.requestId == null ? ++this.requestId : headers.requestId);

	if (body === undefined) {
		body = '';
	}
	if (body == null || body.constructor !== String) {
		body = JSON.stringify(body);
	}

	var msg = [
		JSON.stringify(headers),
		body
	].join(this.headerSeparator);
	//console.log('sending:', msg);
	this.conn.send(msg);
};

Socket.prototype.decode = function(message) {
	//console.log('got:', message);
	var sepPos = message.indexOf(this.headerSeparator);
	var headersStr = message.substring(0, sepPos);
	var body = message.substring(sepPos + this.headerSeparator.length);

	var headers = JSON.parse(headersStr);

	return {
		headers: headers,
		body: body
	};
};


var Http = function (onResponseFunc) {
	this.onResponseFunc = onResponseFunc;
};

Http.prototype.setHeaders = function (req, headers) {
	if (headers) {
		for (var k in headers) {
			req.setRequestHeader(k, headers[k]);
		}
	}
};

Http.prototype.send = function (base, path, method, headers, body, xdomain, callback) {
	if (body === undefined) {
		body = '';
	}
	if (body == null || body.constructor !== String) {
		body = JSON.stringify(body);
	}

	var httpRequest = new XMLHttpRequest();
	var url = base + path;

	var self = this;
	httpRequest.onreadystatechange = function() {
		if(httpRequest.readyState == 4) {
			self.onResponseFunc(httpRequest);
		}
	};

	if (method == 'get' || xdomain) {
		var parts = [];
		if (callback) {
			if (method != 'get') {
				headers = headers || {};
				headers.method = method;
			}
			if (headers) {
				parts.push('headers=' + encodeURIComponent(JSON.stringify(headers)));
			}
		}
		if (body) {
			parts.push('body=' + encodeURIComponent(body));
		}
		if (xdomain) {
			parts.push('xdomain=' + encodeURIComponent(xdomain));
		}
		if (callback) {
			parts.push('callback=' + encodeURIComponent(callback));
		}
		var realUrl = url;
		if (parts.length > 0) {
			realUrl += '?' + parts.join('&');
		}
		httpRequest.open('GET', realUrl);
		if (!callback) {
			this.setHeaders(httpRequest, headers);
		}
		httpRequest.send();
	}
	else {
		httpRequest.open('POST', url);
		httpRequest.setRequestHeader('Content-type', 'application/json');
		if (method != 'create') {
			httpRequest.setRequestHeader('X-Method', method);
		}
		this.setHeaders(httpRequest, headers);
		httpRequest.send(body);
	}
};


var TestPage = function () {
	this.socket = this.createSocket();
	this.http = this.createHttp();
};

TestPage.prototype.initUi = function () {
	this.requestBaseField = this.byId('request-base');
	this.requestPathField = this.byId('request-path');
	this.requestPathFieldGroup = this.byId('request-path-group');
	this.requestMethodField = this.byId('request-method');
	this.requestHeadersField = this.byId('request-headers');
	this.requestHeadersFieldGroup = this.byId('request-headers-group');
	this.requestBodyField = this.byId('request-body');
	this.requestBodyFieldGroup = this.byId('request-body-group');
	this.requestXdomainField = this.byId('request-xdomain');

	this.requestSmartHeadersField = this.byId('request-smart-headers');
	this.requestRawBodyField = this.byId('request-raw-body');

	this.socketConnectButton = this.byId('socket-connect');
	this.socketSendButton = this.byId('socket-send');
	this.httpSendButton = this.byId('http-send');

	this.responseHeadersField = this.byId('response-headers');
	this.responseBodyField = this.byId('response-body');

	this.clearErrOnChange(this.requestPathField, this.requestPathFieldGroup);
	this.clearErrOnChange(this.requestHeadersField, this.requestHeadersFieldGroup);
	this.clearErrOnChange(this.requestBodyField, this.requestBodyFieldGroup);

	this.fixTabs(this.requestHeadersField);
	this.fixTabs(this.requestBodyField);
	this.fixTabs(this.responseHeadersField);
	this.fixTabs(this.responseBodyField);

	this.initButtons();
	this.initKeyHandler();
};

TestPage.prototype.byId = function (id) {
	return document.getElementById(id);
};

TestPage.prototype.fixTabs = function (el) {
	el.addEventListener('keydown', function (e) {
		if(e.keyCode == 9 && !e.altKey && !e.ctrlKey && !e.shiftKey) {
			var start = this.selectionStart;
			var end = this.selectionEnd;

			var value = this.value;
			this.value = [
				value.substring(0, start),
				'\t',
				value.substring(end)
			].join('');

			this.selectionStart = this.selectionEnd = start + 1;
			e.preventDefault();
		}
	});
};

TestPage.prototype.setErr = function (el, errEl, msg) {
	el.title = msg;
	errEl.classList.add('error');
	el.focus();
};

TestPage.prototype.clearErr = function (el, errEl) {
	el.title = null;
	errEl.classList.remove('error');
};

TestPage.prototype.clearErrOnChange = function (el, errEl) {
	var self = this;
	var clearFunc = function () {
		self.clearErr(el, errEl);
	};
	el.addEventListener('change', clearFunc);
	el.addEventListener('keydown', clearFunc);
	el.addEventListener('mousedown', clearFunc);
	el.addEventListener('blur', clearFunc);
};

TestPage.prototype.setPathRequiredErr = function () {
	this.setErr(this.requestPathField, this.requestPathFieldGroup, 'path is required');
};

TestPage.prototype.jsonval = function (el, errEl) {
	var v = el.value;
	var result;
	if (v) {
		var str = '"use strict";\nreturn ' + v;
		try {
			result = (new Function(str))();
		}
		catch (err) {
			this.setErr(el, errEl, err.message);
			throw err;
		}
	}
	return result;
};

TestPage.prototype.createSocket = function () {
	var self = this;
	var result = new Socket(
		function (conn) {
			self.onSocketConnect(conn);
		},
		function (e, data) {
			self.onSocketMessage(e, data);
		},
		function (e) {
			self.onSocketClose(e);
		}
	);
	return result;
};

TestPage.prototype.socketConnect = function () {
	if (this.socket.conn != null) {
		this.socket.close();
	}
	else {
		this.socket.connect();
	}
};

TestPage.prototype.onSocketConnect = function (conn) {
	this.socketConnectButton.innerText = 'disconnect';
};

TestPage.prototype.onSocketClose = function (e) {
	this.socketConnectButton.innerText = 'connect';
};

TestPage.prototype.onSocketMessage = function (e, data) {
	this.showResult(
		data.headers.status,
		data.headers,
		data.body
	);
};

TestPage.prototype.socketSend = function () {
	this.clearResult();
	var fields = this.collectFields();

	var headers = fields.headers || {};
	headers.path = headers.path || fields.path;
	headers.method = headers.method || fields.method;

	if (!headers.path) {
		this.setPathRequiredErr();
	}
	else {
		var socket = this.socket;
		socket.ensureConnected(fields.base, function () {
			socket.send(headers, fields.body);
		});
	}
};

TestPage.prototype.createHttp = function () {
	var self = this;
	return new Http(function (httpRequest) {
		self.onHttpResponse(httpRequest);
	});
};

TestPage.prototype.onHttpResponse = function (httpRequest) {
	this.showResult(
		httpRequest.status,
		httpRequest.getAllResponseHeaders(),
		httpRequest.responseText
	);
};

TestPage.prototype.applyHttpSmartHeaders = function (fields) {
	var headers = fields.headers;
	if (headers.auth) {
		headers['X-Auth'] = headers.auth;
		delete headers.auth;
	}
	if (headers.authExpected) {
		headers['X-AuthExpected'] = headers.authExpected;
		delete headers.authExpected;
	}
	if (headers.method) {
		fields.method = headers.method;
		delete headers.method;
	}
	if (headers.path) {
		fields.path = headers.path;
		delete headers.path;
	}
};

TestPage.prototype.httpSend = function () {
	this.clearResult();

	var fields = this.collectFields();
	if (fields.headers && this.requestSmartHeadersField.checked && !fields.xdomain) {
		this.applyHttpSmartHeaders(fields);
	}

	if (!fields.path) {
		this.setPathRequiredErr();
	}
	else {
		var callback = (fields.xdomain == 'jsonp' ? 'callback' : null);
		this.http.send(
			fields.base,
			fields.path,
			fields.method,
			fields.headers,
			fields.body,
			fields.xdomain,
			callback
		);
	}
};

TestPage.prototype.collectFields = function (cb) {
	return {
		base: this.requestBaseField.value,
		path: this.requestPathField.value,
		method: this.requestMethodField.value,
		headers: this.jsonval(this.requestHeadersField, this.requestHeadersFieldGroup),
		body: this.requestRawBodyField.checked ? this.requestBodyField.value : this.jsonval(this.requestBodyField, this.requestBodyFieldGroup),
		xdomain: this.requestXdomainField.value == 'none' ? null : this.requestXdomainField.value
	};
};

TestPage.prototype.clearResult = function (headers, body) {
	this.responseHeadersField.value = '';
	this.responseBodyField.value = '';
};

TestPage.prototype.showResult = function (status, headers, body) {
	if (headers.constructor !== String) {
		headers = JSON.stringify(headers, null, '\t');
	}
	if (!body || body.constructor !== String) {
		try {
			body = JSON.stringify(JSON.parse(body), null, '\t');
		}
		catch (err) { // to be ready to non-json responses
			console.log(err);
		}
	}

	this.responseHeadersField.value = headers;
	this.responseBodyField.value = ['Response code is ', status, '\n', body].join('');
};

TestPage.prototype.initButtons = function (headers, body) {
	var self = this;

	this.socketConnectButton.addEventListener('click', function () {
		self.socketConnect();
	});

	this.socketSendButton.addEventListener('click', function () {
		self.socketSend();
	});

	this.httpSendButton.addEventListener('click', function () {
		self.httpSend();
	});
};

TestPage.prototype.initKeyHandler = function () {
	var self = this;
	window.addEventListener('keypress', function (e) {
		if (e.keyCode == 13) {
			var tag = e.srcElement.tagName;
			if (tag != 'BUTTON') {
				var ok = true;
				if (tag == 'TEXTAREA') {
					if (e.ctrlKey) {
						e.preventDefault();
					}
					else {
						ok = false;
					}
				}
				if (ok) {
					if (e.altKey) {
						self.socketSendButton.click();
					}
					else {
						self.httpSendButton.click();
					}
				}
			}
		}
	});
};

apis.testPage = {
	Socket: Socket,
	Http: Http,
	TestPage: TestPage
};

})();
