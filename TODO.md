* change client api, make more node-like
	* extract superclass for autheticators
	* make canAuthenticate() cleaner
* error on non-empty expectedIdentity if not authenticated (can get it if auth is optional)
* noFrames (true by default for static)
* sameOrigin
* https support
	* requireTls handler
* secure cookies
* Strict-Transport-Security header

* make event names camelCase ? (check guidelines)
* make ids camelCase on test page

## apis 0.1

* make every part of functionality independently usable:
	* loader
		* with console support
		* extract runner?
	* settings
	* routing
	* cluster
	* domain
	* daemonizer
	* logging
	* websockets
* make following functionality pluggable:
	* JSONP
	* batch requests
	* CORS
* make handlers express.js compatible
* extract req/res extensions to stand-alone lib
* allow to use apis (completely or parts of it):
	* on top of any connect-like framework
	* without intermediate framework (on top of node's http/https modules)

Ideally, apis must become a meta-package bringing together functionality described above.

## misc

* add domain support for socket mechanics
* add response to socket on critical error if has requestId

* client
	* bring timeout functionality back to http client
	* headers can be modified during send() - fix it (?)
	* fix *EventListener issues

* make Loader command set easier to extend
* add ability to run cluster without daemonization

* check content-size header as early as possible (?)

* add ability to specify pre and post handlers for contract
	* keep in mind nested contracts structure
	* actively use ctx during resolution
	* possibly move result functionality somewhere

## browserify

* use -r path:dst when will be fixed (instead of client/expose/browserify.js)

## WARN

* extends http.IncomingMessage.prototype (just like express 2.X does)
* usage of undocumented res._headers (wrap setHeader, removeHeader instead?)
* JSONP has no origin-based restrictions, potential subject of distributed browser-based atacks (don't know good way to fix)
* no compression - add server.use(express.compress()); to mechanics/web after express migration to connect 2.X

## test page

* ability to copy/save/load requests

## batch

* review batches (possibly broken)
* add batches support to client library
* ability to fetch less data than used in 'apply' (?)
* optionally fail on error

## move to standalone lib

* logging (leave wrapper here)
* cluster
* daemon

## logging

* add 'logrotate' command to loader interface (must call 'rotate' on stream-like loggers forcing them to reopen streams)

## stats

* provide cluster stats

* add some kind of lifetime distribution
* add trembling users detection (frequently performing connect then disconnect) (?)
