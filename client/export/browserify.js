"use strict";
var apis = require('../../lib/client');


var parentRequire = window.require;
window.require = function (id) {
	return id == 'apis' ? apis : parentRequire(id);
};
