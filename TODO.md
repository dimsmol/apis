* deny loading from frame by default
	* way to allow frames

* add domain support for socket mechanics
* add response to socket on critical error if has requestId

* allow to reuse connect/express middlewares as handlers

* client
	* body parsing options
	* headers translation options
	* think about moving errors extraction to some common area (lib, etc?)
	* fix *EventListener issues

* think about combining all apis headers into single http header - be careful, can have single row length issues
* make event names camelCase ? (check guidelines)
* make ids camelCase on test page

* make Loader command set easier to extend
* add ability to run cluster without daemonization

## browserify

* use -r path:dst when will be fixed (instead of client/expose/browserify.js)

## WARN

* extends http.IncomingMessage.prototype (just like express 2.X does)
* usage of undocumented res._headers (wrap setHeader, removeHeader instead?)
* JSONP has no origin-based restrictions, potential subject of distributed browser-based atacks (don't know good way to fix)
* no compression - add server.use(express.compress()); to mechanics/web after express migration to connect 2.X
* web mechanics performs req.pause() before call handler, so it may be reasonable to call resume() somewhere ('data' handler does it)

## test page

* move testPage to client/
* ability to copy/save/load requests

## batch

* review batches (possibly broken)
* add batches support to client library
* ability to fetch less data than used in 'apply' (?)
* optionally fail on error

## misc

* move logging to standalone lib, leave wrapper here
	* introduce handlers
* move cluster to standalone library
* move daemon to standalone library

* add 'logrotate' command to loader interface (must call 'rotate' on stream-like loggers forcing them to reopen streams)
* check content-size header as early as possible (?)

* add ability to specify pre and post handlers for contract
	* keep in mind nested contracts structure
	* actively use ctx during resolution
	* possibly move result functionality somewhere

* add fields handler ?
* add range (skip, limit) handler ?
* add tls handler

* make standard 'options' handler more informative (provide contract?)

## stats

* provide cluster stats

* add some kind of lifetime distribution
* add trembling users detection (frequently performing connect then disconnect) (?)
