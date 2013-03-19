UGLIFY_OPTS = -c 'unused=false' -m

client_all: client_js test_page

test_page:
	browserify -e lib/test_page/client/init.js > public/static/test_page/js/test_page.js

client_js:
	browserify ./client/export/browserify.js > client/apis.js
	browserify ./client/export/amd.js > client/apis.amd.js
	browserify ./client/export/global.js > client/apis.global.js
	uglifyjs client/apis.js $(UGLIFY_OPTS) > client/apis.min.js
	uglifyjs client/apis.amd.js $(UGLIFY_OPTS) > client/apis.amd.min.js
	uglifyjs client/apis.global.js $(UGLIFY_OPTS) > client/apis.global.min.js
