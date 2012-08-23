[![build status](https://secure.travis-ci.org/dimsmol/apis.png)](http://travis-ci.org/dimsmol/apis)
## Handlers

Handler interface:

* `setup(chain)` - can be used to perform some interaction between handlers of chain, used by `Impl` and `Ret`
* `handle(ctx)` - async handle, must not throw any exceptions, use `ctx.error()` instead, usually must call `ctx.next()` at some point

HandlerSync interface:

* `setup(chain)` - same as in Handler
* `handle(ctx)` - do not override in regular handlers, use `handleSync(ctx)` instead
* `handleSync(ctx)` - sync handle, must not use `ctx.next`, `ctx.error` and `ctx.cb` directly or indirectly, but can throw exceptions and return value will be used as argument of `ctx.next` automatically
