"use strict";
var path = require('path');
var cont = require('../handlers/contract').cont;
var st = require('../handlers/static').st;
var res = require('../resources').res;
var clientPaths = require('./client').paths;


var staticPath = path.join(__dirname, '../../public/static/test_page');
var contract = cont('', [
	res.subpaths('/js/apis/src', st(clientPaths.src)),
	res.subpaths('/js/apis/min', st(clientPaths.min)),
	res.subpaths('', st(staticPath, { allowIndex: true, redirect: true }))
]);


module.exports = {
	staticPath: staticPath,
	contract: contract
};
