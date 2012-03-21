* add number of connections without endpoint
* add number of endpoints with more than one connection
	* possibly details on such endpoints: which transport is used, how many connections they have

* fix statistics collection (remove unnecessary, make freq counting optional or whatever)

* replace send() with something sending exactly JSON (end()?)

* multirequests
* ctx restore or cloning for multirequests

* ctx.next() and ctx.error() calls check - not more than one call per handler (think how to implement - maybe as this.next(ctx, result) and this.error(ctx, error))

* implement dataspecs
* implement url parsing
