* move all statistics collection out from library - use client code
* replace send() with something sending exactly JSON (end()?)

* way to send custom header along with message, for both send() and sendResult()
* way to specify header to send for result handler
* get rid of opt_connectionsToExclude in send - use iterators or whatever

* multirequests
* ctx restore or cloning for multirequests

* ctx.next() and ctx.error() calls check - not more than one call per handler (think how to implement - maybe as this.next(ctx, result) and this.error(ctx, error))

* implement dataspecs
* implement url parsing
