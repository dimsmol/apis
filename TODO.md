* noFrames (true by default for static)
* sameOrigin
* https support
	* requireTls handler

* make event names camelCase ? (check guidelines)
* make ids camelCase on test page

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
* web mechanics performs req.pause() before call handler, so it may be reasonable to call resume() somewhere ('data' handler does it) - will not be an issue after moving to node 0.10

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
