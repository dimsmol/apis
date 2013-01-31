"use strict";
// RegExp-like objects for path matching

var Subpaths = function (path) {
	this.path = path;
};

Subpaths.prototype.exec = function (path) {
	var result = null;
	if (!path && !this.path || path && path.indexOf(this.path) === 0 && (path.length == this.path.length || path[this.path.length] == '/')) {
		result = [path]; // 0 idx must be matched part like in RegExp
		result.path = path.substr(this.path.length);
	}
	return result;
};

Subpaths.subpaths = function (path) {
	return new Subpaths(path);
};


module.exports = {
	Subpaths: Subpaths,
	subpaths: Subpaths.subpaths
};
