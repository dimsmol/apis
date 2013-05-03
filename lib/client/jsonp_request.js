"use strict";
var NetworkError = require('./errors').NetworkError;


var JsonpRequest = function (opt_options) {
	var options = opt_options || {};
	this.callbackUrlKey = options.callbackUrlKey || this.defaultCallbackUrlKey;

	this.callbacks = this.getCallbacks();

	this.cb = null;
	this.scriptEl = null;
	this.callbackId = null;
};

JsonpRequest.prototype.callbacksGlobalPath = 'apis.jsonp.callbacks';
JsonpRequest.prototype.defaultCallbackUrlKey = 'callback';

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

JsonpRequest.prototype.send = function (url, cb) {
	this.cb = cb;
	this.initCallback();
	url = this.addCallbackToUrl(url);
	this.injectScript(url);
};

JsonpRequest.prototype.initCallback = function () {
	var self = this;
	this.callbackId = this.createCallbackId();
	this.callbacks[this.callbackId] = function (result) {
		if (!self.isAborted) {
			self.cleanup();
			self.handleResult(result);
		}
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

JsonpRequest.prototype.addCallbackToUrl = function (url) {
	var pos = url.indexOf('?');
	var result;
	if (pos < 0) {
		result = [
			url, '?',
			this.callbackUrlKey, '=', this.createCallbackName()
		].join('');
	}
	else {
		result = [
			url.substr(0, pos + 1),
			this.callbackUrlKey, '=', this.createCallbackName(),
			'&', url.substr(pos + 1)
		].join('');
	}
	return result;
};

JsonpRequest.prototype.createCallbackName = function () {
	return [this.callbacksGlobalPath, '.', this.callbackId].join('');
};

JsonpRequest.prototype.createScript = function () {
	var el = document.createElement('script');
	el.async = true;
	var self = this;
	el.onerror = function (ev) {
		self.handleScriptErrorEvent(ev);
	};
	return el;
};

JsonpRequest.prototype.injectScript = function (url) {
	var scriptEl = this.createScript();
	this.scriptEl = scriptEl;

	var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
	var firstChild = head.firstChild;
	if (firstChild) {
		head.insertBefore(scriptEl, head.firstChild);
	}
	else {
		head.appendChild(scriptEl);
	}

	scriptEl.src = url;
};

JsonpRequest.prototype.handleScriptErrorEvent = function (ev) {
	if (!this.isAborted) {
		this.cleanup();
		this.cb(new NetworkError());
	}
};

JsonpRequest.prototype.abort = function () {
	this.isAborted = true;
	this.cleanup();
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
	if (scriptEl != null && scriptEl.parentNode) {
		scriptEl.parentNode.removeChild(scriptEl);
		this.scriptEl = null;
	}
};

JsonpRequest.prototype.handleResult = function (result) {
	var headers = result.headers || {};
	result.headers = headers;
	result.status = headers.status;
	this.cb(null, result);
};

JsonpRequest.send = function (url, options, cb) {
	var instance = new JsonpRequest(options);
	instance.send(url, cb);
	return instance;
};


module.exports = JsonpRequest;
