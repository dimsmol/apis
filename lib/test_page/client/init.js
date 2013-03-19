"use strict";
var TestPage = require('./test_page');


var testPage = new TestPage();
window.addEventListener('load', function () {
	testPage.initUi();
});
