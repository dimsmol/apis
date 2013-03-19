"use strict";
var apis = require('../../lib/client');


var hasOld = 'apis' in window;
var oldApis = window.apis;

window.apis = apis;
apis.noConflict = function () {
	if (hasOld) {
		window.apis = oldApis;
	}
	else {
		delete window.apis;
	}
	return apis;
};
