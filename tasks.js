"use strict";
var trun = require('trun');
var prun = trun.wrapped.prun;

var uglifyOpts = "-c 'unused=false' -m";

var runner = new trun.Runner();
runner.addTasks({
	default: 'clients',

	clients: [
		'client',
		'testPage'
	],

	client: [
		prun('browserify client/export/browserify.js > client/apis.js'),
		prun('browserify client/export/amd.js > client/apis.amd.js'),
		prun('browserify client/export/global.js > client/apis.global.js'),

		prun('uglifyjs client/apis.js ', uglifyOpts, ' > client/apis.min.js'),
		prun('uglifyjs client/apis.amd.js ', uglifyOpts, ' > client/apis.amd.min.js'),
		prun('uglifyjs client/apis.global.js ', uglifyOpts, ' > client/apis.global.min.js')
	],

	testPage:
		prun('browserify lib/test_page/client/init.js > public/static/test_page/js/test_page.js')
});
runner.start();
