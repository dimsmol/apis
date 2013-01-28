require(['./test_page'],
function(TestPage) {
"use strict";

var testPage = new TestPage();
window.addEventListener('load', function () {
	testPage.initUi();
});

});
