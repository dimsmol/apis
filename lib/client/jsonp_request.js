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
