"use strict";
var path = require('path');
var cont = require('../handlers/contract').cont;
var st = require('../handlers/static').st;
var res = require('../resources').res;
var clientPaths = require('./client').paths;


var result = {
	staticPath: path.join(__dirname, '../../public/static/test_page')
};
Object.defineProperties(result, {
	contract: {
		get: function () {
			return cont('', [
				res.subpaths('/js/apis/src', st(clientPaths.src)),
				res.subpaths('/js/apis/min', st(clientPaths.min)),
				res.subpaths('', st(this.staticPath, { allowIndex: true, redirect: true }))
			]);
		}
	}
});


module.exports = result;
