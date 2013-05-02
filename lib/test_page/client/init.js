"use strict";
var TestPage = require('./test_page');


var testPage = new TestPage();
addEventListener('load', function () {
	testPage.initUi();
});
