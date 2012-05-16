## ctx

* move things to ctx.core (?)

## libs

* move logging to standalone lib, leave wrapper here
	* introduce handlers

## handlers

* shorten names (as in valid)

## modularity

* body parsing on demand
* cookie parsing on demand
* think about sub-apps
	* app as Unit
	* static must become part of contract
	* ctx transition on descending to sub-app

## routing

* implement url parsing

## transportation

* way to send custom header along with message, both for send() and sendResult()
* way to specify header to send for result handler
* get rid of opt_connectionsToExclude in send - use iterators or whatever

## multirequests

* multirequests
* ctx restore or cloning for multirequests

## validation

* check errors for ret/result (?)

## stats

* add some kind of lifetime distribution
* add trembling users detection (frequently performing connect then disconnect) (?)
