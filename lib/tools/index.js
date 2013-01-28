"use strict";
var DoubleDict = require('./double_dict');
var http = require('./http');
var path = require('./path');
var client = require('./client');
var testPage = require('./test_page');


module.exports = {
	DoubleDict: DoubleDict,
	http: http,
	path: path,
	client: client,
	testPage: testPage
};
