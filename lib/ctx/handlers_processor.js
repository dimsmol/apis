"use strict";
var HandlersWalker = function (handlers) {
	this.handlers = handlers;
	this.pos = 0;
};

HandlersWalker.prototype.next = function () {
	var result = null;
	if (this.pos < this.handlers.length) {
		result = this.handlers[this.pos++];
	}
	return result;
};


var HandlersProcessor = function () {
	this.walkers = []; // stack of walkers
	this.walker = null;
};

// entering subchain
HandlersProcessor.prototype.enter = function (handlers) {
	if (this.walker) {
		this.walkers.push(this.walker);
	}
	this.walker = new HandlersWalker(handlers);
};

HandlersProcessor.prototype.next = function () {
	var result = null;
	if (this.walker != null) {
		result = this.walker.next();
		if (result == null && this.walkers.length > 0) {
			this.walker = this.walkers.pop();
			result = this.next();
		}
	}
	return result;
};


module.exports = {
	HandlersProcessor: HandlersProcessor,
	HandlersWalker: HandlersWalker
};
