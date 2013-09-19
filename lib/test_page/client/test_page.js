"use strict";
var mt = require('marked_types');
var apis = require('../../client');
var WebError = require('../../node_client/web_error');
var SockJS = window.SockJS;


var TestPage = function () {
	this.socket = null;
	this.http = null;
};

TestPage.prototype.createHttp = function () {
	return new apis.Http(this.requestBaseField.value);
};

TestPage.prototype.createSocket = function () {
	var result = new apis.Socket(this.requestBaseField.value);
	result.setWebSocketClass(SockJS);
	var self = this;
	result.onSocketCreated = function (socket) {
		socket.addEventListener('open', function (ev) {
			self.onSocketOpen(ev);
		});
		socket.addEventListener('close', function (ev) {
			self.onSocketClose(ev);
		});
	};
	result.onMessage = function (result) {
		self.showResult(result);
	};
	return result;
};

TestPage.prototype.httpSend = function () {
	this.clearResult();

	var fields = this.collectFields();
	if (fields.headers && this.requestSmartHeadersField.checked) {
		this.applyHttpSmartHeaders(fields);
	}

	if (!fields.path) {
		this.setPathRequiredErr();
	}
	else {
		if (this.http == null || this.http.baseUri != this.requestBaseField.value) {
			this.http = this.createHttp();
		}
		var funcName = (fields.crossDomain == 'none' ? 'send' : fields.crossDomain);
		var self = this;
		var req = this.http.send(
			fields.path,
			fields.method,
			fields.headers,
			fields.data,
			{
				crossDomain: fields.crossDomain == 'none' ? null : fields.crossDomain
			},
			function (err, result) {
				if (err != null) {
					self.showError(err);
				}
				else {
					self.showResult(result);
				}
			}
		);
	}
};

TestPage.prototype.socketSend = function () {
	this.clearResult();
	var fields = this.collectFields();

	var headers = fields.headers || {};
	var path = headers.path || fields.path;
	var method = headers.method || fields.method;

	if (!path) {
		this.setPathRequiredErr();
	}
	else {
		if (this.socket == null || this.socket.baseUri != this.requestBaseField.value) {
			if (this.socket != null) {
				this.socket.close();
			}
			this.socket = this.createSocket();
		}
		var self = this;
		this.socket.send(path, method, headers, fields.data, null, function (err, result) {
			if (err != null) {
				self.showError(err);
			}
			else {
				self.showResult(result);
			}
		});
	}
};

TestPage.prototype.socketConnect = function (ev) {
	if (this.socket == null) {
		this.socket = this.createSocket();
	}
	var readyState = (this.socket.socket == null ? null : this.socket.socket.readyState);
	switch (readyState) {
		case null:
		case 3: // closing
		case 4: // closed
			this.socket.connect();
			break;
		case 1:
			this.socket.close();
			break;
	}
};

TestPage.prototype.onSocketOpen = function (ev) {
	this.socketConnectButton.innerText = 'disconnect';
};

TestPage.prototype.onSocketClose = function (ev) {
	this.socketConnectButton.innerText = 'connect';
};

TestPage.prototype.onSocketMessage = function (e, data) {
	this.showResult(
		data.headers.status,
		data.headers,
		data.body
	);
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
	this.requestCrossDomainField = this.byId('request-crossDomain');

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

TestPage.prototype.applyHttpSmartHeaders = function (fields) {
	var headers = fields.headers;
	if (headers.method) {
		fields.method = headers.method;
		delete headers.method;
	}
	if (headers.path) {
		fields.path = headers.path;
		delete headers.path;
	}
};

TestPage.prototype.collectFields = function (cb) {
	return {
		path: this.requestPathField.value,
		method: this.requestMethodField.value,
		headers: this.jsonval(this.requestHeadersField, this.requestHeadersFieldGroup),
		data: this.requestRawBodyField.checked ? this.requestBodyField.value : this.jsonval(this.requestBodyField, this.requestBodyFieldGroup),
		crossDomain: this.requestCrossDomainField.value == 'none' ? null : this.requestCrossDomainField.value
	};
};

TestPage.prototype.clearResult = function (headers, body) {
	this.responseHeadersField.value = '';
	this.responseBodyField.value = '';
};

TestPage.prototype.showResult = function (result) {
	var status = result.status;
	var headers = JSON.stringify(result.headers, null, '\t');
	var body = result.data;
	try {
		body = JSON.stringify(body, null, '\t');
	}
	catch (err) { // to be ready to non-json responses
	}

	if (result.transport != null) {
		headers = headers + '\n\n' + result.transport.getAllResponseHeaders();
	}

	this.responseHeadersField.value = headers;
	this.responseBodyField.value = ['Response code is ', status, '\n', body].join('');
};

TestPage.prototype.showError = function (err) {
	if (mt.is(err, WebError)) {
		var status = err.status;
		var headers = JSON.stringify(err.result.headers, null, '\t');
		var body = err.result.data;
		try {
			body = JSON.stringify(body, null, '\t');
		}
		catch (err) { // to be ready to non-json responses
		}

		this.responseHeadersField.value = headers;
		this.responseBodyField.value = ['Response code is ', status, '\n', body].join('');
	}
	else {
		this.responseHeadersField.value = '';
		this.responseBodyField.value = (err.getStackTrace ? err.getStackTrace() || err.stack : err.stack) || err;
	}
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
	addEventListener('keypress', function (e) {
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


module.exports = TestPage;
