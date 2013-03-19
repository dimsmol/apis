;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){
"use strict"
var apis = require('../../lib/client');


var parentRequire = window.require;
window.require = function (id) {
	return id == 'apis' ? apis : parentRequire(id);
};

},{"../../lib/client":2}],2:[function(require,module,exports){
"use strict";
var errors = require('./errors');
var Http = require('./http');
var HttpRequest = require('./http_request');
var JsonpRequest = require('./jsonp_request');
var Socket = require('./socket');


module.exports = {
	errors: errors,
	Http: Http,
	HttpRequest: HttpRequest,
	JsonpRequest: JsonpRequest,
	Socket: Socket
};

},{"./errors":3,"./http":4,"./http_request":5,"./jsonp_request":6,"./socket":7}],4:[function(require,module,exports){
"use strict";
var HttpRequest = require('./http_request');
var JsonpRequest = require('./jsonp_request');


var Http = function (opt_baseUri) {
	this.baseUri = opt_baseUri;
};

Http.prototype.send = function (path, method, headers, data, options, cb) {
	var result;
	if (options == null || options.crossDomain == null) {
		result = this.sendHttp(path, method, headers, data, options, cb);
	}
	else {
		switch (options.crossDomain) {
			case 'jsonp':
				result = this.sendJsonp(path, method, headers, data, options, cb);
				break;
			default:
				throw new Error('Unsupported crossDomain option ' + options.crossDomain);
		}
	}
	return result;
};

Http.prototype.sendHttp = function (path, method, headers, data, options, cb) {
	return new HttpRequest(this, path, method, headers, data, options, cb).send();
};

Http.prototype.sendJsonp = function (path, method, headers, data, options, cb) {
	return new JsonpRequest(this, path, method, headers, data, options, cb).send();
};


module.exports = Http;

},{"./http_request":5,"./jsonp_request":6}],5:[function(require,module,exports){
"use strict";
var errors = require('./errors');


var HttpRequest = function (http, path, method, headers, data, options, cb) {
	this.http = http;
	this.options = options || {};
	this.path = path;
	this.method = method;
	this.headers = headers || {};
	this.data = data;
	this.cb = cb;

	this.url = null;
	this.body = null;
	this.transport = null;
	this.isAborted = false;
	this.timeout = null;
};

HttpRequest.prototype.methodHttpHeaderName = 'X-Method';
HttpRequest.prototype.authHttpHeaderName = 'X-Auth';
HttpRequest.prototype.authExpectedHttpHeaderName = 'X-AuthExpected';
HttpRequest.prototype.authRenewalHttpHeaderName = 'X-AuthRenewal';
HttpRequest.prototype.authRenewalIssuedHttpHeaderName = 'X-AuthRenewalIssued';
HttpRequest.prototype.authRenewalMaxAgeHttpHeaderName = 'X-AuthRenewalMaxAge';

HttpRequest.prototype.headersUrlKey = 'headers';
HttpRequest.prototype.bodyUrlKey = 'body';
HttpRequest.prototype.xdomainUrlKey = 'xdomain';

HttpRequest.prototype.defaultContentType = 'application/json';

HttpRequest.prototype.send = function () {
	this.createTimeout();
	this.url = this.createUrl();
	this.body = this.createBody();
	this.transport = this.createTransport();
	this.createCallback();
	this.sendInternal();
	return this;
};

HttpRequest.prototype.abort = function () {
	this.isAborted = true;
	this.clearTimeout();
	if (this.transport != null) {
		this.transport.onreadystatechange = null;
		this.transport.abort();
	}
};

HttpRequest.prototype.createTimeout = function () {
	var timeout = this.options.timeout;
	if (timeout != null) {
		var self = this;
		this.timeout = setTimeout(function () {
			self.handleTimeout();
		}, timeout);
	}
};

HttpRequest.prototype.handleTimeout = function () {
	this.abort();
	this.cb(new errors.TimeoutError());
};

HttpRequest.prototype.clearTimeout = function () {
	if (this.timeout != null) {
		clearTimeout(this.timeout);
	}
};

HttpRequest.prototype.createUrl = function () {
	var result = this.path;
	if (this.http.baseUri) {
		result = this.http.baseUri + this.path;
	}
	return result;
};

HttpRequest.prototype.createBody = function () {
	var result;
	if (this.data === undefined) {
		result = '';
	}
	else {
		result = JSON.stringify(this.data);
	}
	return result;
};

HttpRequest.prototype.createTransport = function () {
	return new XMLHttpRequest();
};

HttpRequest.prototype.createCallback = function () {
	var self = this;
	// NOTE use onload/onerror pair instead of
	// onreadystatechange in future (will break IE8 support)
	this.transport.onreadystatechange = function() {
		if(self.transport.readyState == 4) {
			self.transport.onreadystatechange = null;
			if (self.isNetworkError()) {
				self.handleNetworkError();
			}
			else {
				self.handleResponse();
			}
		}
	};
};

HttpRequest.prototype.isNetworkError = function () {
	// NOTE works incorrectly with file:// protocol
	return !this.transport.status;
};

HttpRequest.prototype.handleNetworkError = function () {
	this.clearTimeout();
	this.cb(new errors.NetworkError());
};

HttpRequest.prototype.sendInternal = function () {
	if (this.method == 'get') {
		this.sendGet();
	}
	else {
		this.sendPost();
	}
};

HttpRequest.prototype.sendGet = function () {
	this.transport.open('GET', this.createGetUrl());
	this.setHttpHeaders();
	this.transport.send();
};

HttpRequest.prototype.createGetUrl = function () {
	var parts = this.createGetUrlParts();
	var result = this.url;
	if (parts.length > 0) {
		result += '?' + parts.join('&');
	}
	return result;
};

HttpRequest.prototype.createGetUrlParts = function (opt_parts) {
	var parts = opt_parts || [];
	if (this.body) {
		parts.push(this.bodyUrlKey + '=' + encodeURIComponent(this.body));
	}
	return parts;
};

HttpRequest.prototype.sendPost = function () {
	var transport = this.transport;
	transport.open('POST', this.url);
	this.setContentTypeHttpHeader();
	this.setMethodHttpHeader();
	this.setHttpHeaders();
	transport.send(this.body);
};

HttpRequest.prototype.setHttpHeaders = function () {
	var headers = this.createHttpHeaders();
	var transport = this.transport;
	for (var k in headers) {
		transport.setRequestHeader(k, headers[k]);
	}
};

HttpRequest.prototype.createHttpHeaders = function () {
	var headers = this.headers;
	var result = headers.http || {};
	delete headers.http;
	if (headers.auth) {
		result[this.authHttpHeaderName] = headers.auth;
	}
	if (headers.authExpected) {
		result[this.authExpectedHttpHeaderName] = headers.authExpected;
	}
	return result;
};

HttpRequest.prototype.setContentTypeHttpHeader = function () {
	var contentType = this.headers.http && this.headers.http['Content-type'] || this.headers.contentType || this.defaultContentType;
	this.transport.setRequestHeader('Content-type', contentType);
};

HttpRequest.prototype.setMethodHttpHeader = function () {
	if (this.method != 'create') {
		this.transport.setRequestHeader(this.methodHttpHeaderName, this.method);
	}
};

HttpRequest.prototype.handleResponse = function () {
	this.clearTimeout();
	var result = this.createResult();
	var err = this.extractError(result);
	if (err != null) {
		this.cb(err);
	}
	else {
		this.cb(null, result);
	}
};

HttpRequest.prototype.createResult = function () {
	var result = {
		headers: this.getResultHeaders(),
		data: this.getResultData()
	};
	var status = this.getResultStatus();
	if (status != null) {
		result.status = status;
	}
	var transport = this.getTransportForResult();
	if (transport != null) {
		result.transport = transport;
	}
	return result;
};

HttpRequest.prototype.getTransportForResult = function () {
	return this.transport;
};

HttpRequest.prototype.getResultStatus = function () {
	return this.transport.status;
};

HttpRequest.prototype.getResultHeaders = function () {
	var result = {};
	var authRenewalToken = this.transport.getResponseHeader(this.authRenewalHttpHeaderName);
	if (authRenewalToken) {
		var renewal = {
			token: authRenewalToken
		};
		result.authRenewal = renewal;
		var issued = this.transport.getResponseHeader(this.authRenewalIssuedHttpHeaderName);
		if (issued) {
			renewal.issued = new Date(issued);
		}
		var maxAge = this.transport.getResponseHeader(this.authRenewalMaxAgeHttpHeaderName);
		if (maxAge) {
			renewal.maxAge = parseInt(maxAge, 10);
		}
	}
	return result;
};

HttpRequest.prototype.getResultData = function () {
	var body = this.getResultBody();
	return body ? JSON.parse(body) : undefined;
};

HttpRequest.prototype.getResultBody = function () {
	return this.transport.responseText;
};

HttpRequest.prototype.extractError = function (result) {
	var status = result.status;
	var err = null;
	if (status != 200 && status != 204) {
		err = new errors.WebError(result);
	}
	return err;
};


module.exports = HttpRequest;

},{"./errors":3}],7:[function(require,module,exports){
"use strict";
var errors = require('./errors');


var Socket = function (opt_basePath, opt_socketUri, opt_protocols) {
	this.basePath = opt_basePath;
	this.socketUri = opt_socketUri || this.defaultSocketUri;
	this.protocols = opt_protocols;

	this.onSocketCreated = null;
	this.onMessage = null;

	// NOTE you can set this property to use sockjs or whatever
	this.customWebSocketClass = null;

	this.socket = null;
	this.requests = {};

	this.abortFunc = this.createAbortFunc();
};

Socket.prototype.defaultSocketUri = '/socket';
Socket.prototype.headerSeparator = '\n\n';
Socket.prototype.defaultTimeout = null;

Socket.prototype.getWebSocketClass = function () {
	return this.customWebSocketClass || WebSocket;
};

Socket.prototype.createAbortFunc = function () {
	var self = this;
	return function () {
		self.handleAbort(this);
	};
};

Socket.prototype.createSocket = function () {
	var WebSocketClass = this.getWebSocketClass();
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
			var err = this.extractError(result);
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

Socket.prototype.extractError = function (result) {
	var status = result.status;
	var err = null;
	if (status != 200 && status != 204) {
		err = new errors.WebError(result);
	}
	return err;
};


module.exports = Socket;

},{"./errors":3}],3:[function(require,module,exports){
"use strict";
var inherits = require('inh');
var ErrorBase = require('nerr/lib/error_base');


var WebError = function (response) {
	ErrorBase.call(this);

	this.response = response;

	this.status = response.status;
	var data = response.data || {};
	this._message = data.message;
	this.status = response.status;
	this.code = data.code;
};
inherits(WebError, ErrorBase);

WebError.prototype.name = 'WebError';

WebError.prototype.getMessage = function () {
	return this._message;
};


var NetworkError = function () {
	ErrorBase.call(this);
};
inherits(NetworkError, ErrorBase);

NetworkError.prototype.name = 'NetworkError';


var TimeoutError = function () {
	ErrorBase.call(this);
};
inherits(TimeoutError, ErrorBase);

TimeoutError.prototype.name = 'TimeoutError';


var ConnectionCloseError = function (closeEvent) {
	ErrorBase.call(this);
	this.closeEvent = closeEvent;
};
inherits(ConnectionCloseError, ErrorBase);

ConnectionCloseError.prototype.name = 'ConnectionCloseError';

ConnectionCloseError.prototype.getMessage = function () {
	return this.closeEvent.reason;
};


module.exports = {
	WebError: WebError,
	NetworkError: NetworkError,
	TimeoutError: TimeoutError,
	ConnectionCloseError: ConnectionCloseError
};

},{"nerr/lib/error_base":8,"inh":9}],6:[function(require,module,exports){
"use strict";
var inherits = require('inh');
var HttpRequest = require('./http_request');
var errors = require('./errors');


var JsonpRequest = function (http, path, method, headers, data, options, cb) {
	HttpRequest.call(this, http, path, method, headers, data, options, cb);
	this.callbacks = this.getCallbacks();
	this.scriptEl = null;
	this.callbackId = null;
	this.response = null;
};
inherits(JsonpRequest, HttpRequest);

JsonpRequest.callbacks = null;

JsonpRequest.prototype.callbacksGlobalPath = 'apis.jsonp.callbacks';
JsonpRequest.prototype.xdomainValue = 'jsonp';
JsonpRequest.prototype.jsonpCallbackUrlKey = 'callback';

JsonpRequest.prototype.abort = function () {
	this.isAborted = true;
	this.clearTimeout();
};

JsonpRequest.prototype.getCallbacks = function () {
	if (JsonpRequest.callbacks == null) {
		var parts = this.callbacksGlobalPath.split('.');
		var curr = window;
		for (var i = 0; i < parts.length; i++) {
			var part = parts[i];
			var next = curr[part] || {};
			curr[part] = next;
			curr = next;
		}
		JsonpRequest.callbacks = curr;
	}
	return JsonpRequest.callbacks;
};

JsonpRequest.prototype.createTransport = function () {
	var el = document.createElement('script');
	el.async = true;
	var self = this;
	el.onerror = function (ev) {
		self.handleScriptErrorEvent(ev);
	};
	this.scriptEl = el;
	return el;
};

JsonpRequest.prototype.handleScriptErrorEvent = function (ev) {
	this.cleanup();
	if (!this.isAborted) {
		this.cb(new errors.NetworkError());
	}
};

JsonpRequest.prototype.createCallback = function () {
	var self = this;
	this.callbackId = this.createCallbackId();
	this.callbacks[this.callbackId] = function (response) {
		self.response = response;
		self.handleResponse();
	};
};

JsonpRequest.prototype.createCallbackId = function () {
	var base = 'cb' + (new Date().getTime());
	var i = 0;
	var result = base;
	while (result in this.callbacks) {
		result = base + '_' + (i++);
	}
	return result;
};

JsonpRequest.prototype.sendInternal = function () {
	this.scriptEl.src = this.createGetUrl();

	var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
	var firstChild = head.firstChild;
	if (firstChild) {
		head.insertBefore(this.scriptEl, head.firstChild);
	}
	else {
		head.appendChild(this.scriptEl);
	}
};

JsonpRequest.prototype.createGetUrlParts = function (opt_parts) {
	var parts = opt_parts || [];
	var headers = this.headers;
	if (this.method != 'get') {
		headers = headers || {};
		headers.method = this.method;
	}
	if (headers) {
		parts.push(this.headersUrlKey + '=' + encodeURIComponent(JSON.stringify(headers)));
	}
	JsonpRequest.super_.prototype.createGetUrlParts.call(this, parts);
	parts.push(this.xdomainUrlKey + '=' + this.xdomainValue);
	parts.push(this.jsonpCallbackUrlKey + '=' + encodeURIComponent(this.createCallbackName()));
	return parts;
};

JsonpRequest.prototype.createCallbackName = function () {
	return this.callbacksGlobalPath + '.' + this.callbackId;
};

JsonpRequest.prototype.setHttpHeaders = function () {
};

JsonpRequest.prototype.handleResponse = function () {
	this.cleanup();
	if (!this.isAborted) {
		JsonpRequest.super_.prototype.handleResponse.call(this);
	}
};

JsonpRequest.prototype.cleanup = function () {
	this.clearTimeout();
	this.removeCallback();
	this.removeScripEl();
};

JsonpRequest.prototype.removeCallback = function () {
	delete this.callbacks[this.callbackId];
};

JsonpRequest.prototype.removeScripEl = function () {
	var scriptEl = this.scriptEl;
	if (scriptEl != null && scriptEl.parentNode) {
		scriptEl.parentNode.removeChild(scriptEl);
		this.scriptEl = null;
	}
};

JsonpRequest.prototype.getTransportForResult = function () {
	return null;
};

JsonpRequest.prototype.getResultStatus = function () {
	var headers = this.getResultHeaders();
	return headers.status;
};

JsonpRequest.prototype.getResultHeaders = function () {
	return this.response.headers || {};
};

JsonpRequest.prototype.getResultData = function () {
	return this.response.data;
};


module.exports = JsonpRequest;

},{"./http_request":5,"./errors":3,"inh":9}],9:[function(require,module,exports){
"use strict";
var inherits = function(childCtor, parentCtor) {
	var TempCtor = function () {};
	TempCtor.prototype = parentCtor.prototype;
	childCtor.super_ = parentCtor;
	childCtor.prototype = new TempCtor();
	childCtor.prototype.constructor = childCtor;
};


module.exports = inherits;

},{}],8:[function(require,module,exports){
"use strict";
var inherits = require('inh');


var ErrorBase = function () {
	Error.call(this);
	this.captureStackTrace();
};
inherits(ErrorBase, Error);

ErrorBase.prototype.name = 'ErrorBase';

ErrorBase.prototype.captureStackTrace = function () {
	if (Error.captureStackTrace) {
		Error.captureStackTrace(this, this.constructor);
	}
	else {
		var stackKeeper = new Error();
		var self = this;
		stackKeeper.toString = function () { return self.toString(); };
		var getStackTrace = function () {
			return stackKeeper.stack;
		};

		if (Object.defineProperties) {
			Object.defineProperties({
				stack: getStackTrace
			});
		}
		else {
			this.getStackTrace = getStackTrace;
		}
	}
};

ErrorBase.prototype.toString = function () {
	var result = this.name;
	var message = this.getMessage();
	if (message) {
		result = [result, message].join(': ');
	}
	return result;
};

ErrorBase.prototype.getMessage = function () {
	return null;
};

ErrorBase.prototype.getStackTrace = function () {
	return this.stack;
};

if (Object.defineProperties) {
	Object.defineProperties(ErrorBase.prototype, {
		message: {
			get: function () {
				return this.getMessage();
			}
		}
	});
}


module.exports = ErrorBase;

},{"inh":10}],10:[function(require,module,exports){
"use strict";
var inherits = function(childCtor, parentCtor) {
	var TempCtor = function () {};
	TempCtor.prototype = parentCtor.prototype;
	childCtor.super_ = parentCtor;
	childCtor.prototype = new TempCtor();
	childCtor.prototype.constructor = childCtor;
};


module.exports = inherits;

},{}]},{},[1])
;