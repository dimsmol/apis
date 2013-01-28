define(['./inherits', './http_request'],
function (inherits, HttpRequest) {
"use strict";

var JsonpRequest = function (http, path, method, headers, data, options, cb) {
	HttpRequest.call(this, http, path, method, headers, data, options, cb);
	this.callbacks = this.getCallbacks();
	this.scriptEl = null;
	this.callbackId = null;
};
inherits(JsonpRequest, HttpRequest);

JsonpRequest.prototype.callbacksGlobalPath = 'apis.jsonp.callbacks';
JsonpRequest.prototype.xdomainValue = 'jsonp';
JsonpRequest.prototype.jsonpCallbackUrlKey = 'callback';

JsonpRequest.prototype.getCallbacks = function () {
	var parts = this.callbacksGlobalPath.split('.');
	var curr = window;
	for (var i = 0; i < parts.length; i++) {
		var part = parts[i];
		var next = curr[part] || {};
		curr[part] = next;
		curr = next;
	}
	return curr;
};

JsonpRequest.prototype.createEngine = function () {
	var scriptEl = document.createElement('script');
	scriptEl.async = true;
	this.scriptEl = scriptEl;
	return scriptEl;
};

JsonpRequest.prototype.createCallback = function () {
	var self = this;
	this.callbackId = this.createCallbackId();
	this.callbacks[this.callbackId] = function (result) {
		self.handleResponse(result);
	};
};

JsonpRequest.prototype.createCallbackId = function () {
	var base = 'cb' + Date.now();
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
	var parts = JsonpRequest.super_.prototype.createGetUrlParts(opt_parts);
	parts.push(this.xdomainUrlKey + '=' + this.xdomainValue);
	parts.push(this.jsonpCallbackUrlKey + '=' + encodeURIComponent(this.createCallbackName()));
	return parts;
};

JsonpRequest.prototype.createCallbackName = function () {
	return this.callbacksGlobalPath + '.' + this.callbackId;
};

JsonpRequest.prototype.handleResponse = function (result) {
	this.cleanup();
	if (result.headers.status != null) {
		result.status = result.headers.status;
	}
	this.cb(null, result);
};

JsonpRequest.prototype.cleanup = function () {
	this.removeCallback();
	this.removeScripEl();
};

JsonpRequest.prototype.removeCallback = function () {
	delete this.callbacks[this.callbackId];
};

JsonpRequest.prototype.removeScripEl = function () {
	var scriptEl = this.scriptEl;
	if (scriptEl.parentNode) {
		scriptEl.parentNode.removeChild(scriptEl);
	}
};


return JsonpRequest;

});
