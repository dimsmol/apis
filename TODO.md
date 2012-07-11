* restrict batch to POST or 'call' (maybe allow GET if all subrequests are GET)
* move _json parsing to mechanics, add headers there
* use domains for error handling and to ensure every request will be responded !!!

* add server.use(express.compress()); to config/web after express migration to connect 2.X

## handlers

* fields
* range (skip, limit)

## batch

* ability to fetch less data than used in 'apply' (?)
* fix problems with headers searching (auth, clientInfo - will fail for now)
* optionally fail on error

## REST

* stateless all the way
* GET must be cacheable !!!
	* think about url & args, how to provide cacheable structure
* PUT vs POST
	* PUT is safe to repeat (example: update something)
	* POST is not safe to repeat - can create copies (example: create)
* DELETE is safe to repeat (just ensures that it's deleted)

## libs

* move logging to standalone lib, leave wrapper here
	* introduce handlers

## modularity

* body parsing on demand
* cookie parsing on demand
* static must become part of contract

## routing

* implement url parsing

## transport

* way to send custom headers along with message, both for send() and sendResult()
* way to specify headers to send for result handler
* get rid of opt_connectionsToExclude in send - use iterators or whatever

## stats

* add some kind of lifetime distribution
* add trembling users detection (frequently performing connect then disconnect) (?)
