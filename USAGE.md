> some examples will be shown using typescript, all examples are esm (but can also be cjs)

# Setup main file

In this section each code sample will show more features, so be ready to see them one by one.

## no routers or other imports

### without package

```typescript
import uWS from "uWebSockets.js";

const server = uWS.App();

server.any("/*", (res, req) => {
  // manually handle this
  res.writeStatus("404").end("Nothing to see here!");
});

// though I don't use "run", it is needed for example
function run() {
  server.listen(9001, (token) =>
    token ? console.info("Start success") : console.error("Start failure")
  );
}

run();
```

### with core package (low deps)

```typescript
import uWS from "uWebSockets.js";

// c404 is an ArrayBuffer (not all codes are converted, don't worry), toAB - conversion helper
import { c404, toAB } from "@ublitzjs/core";

const server = uWS.App();

var noFoundMessage = toAB("Nothing to see here!");
server.any("/*", (res, req) => {
  res.writeStatus(c404).end(notFoundMessage);
});

function run() {
  server.listen(9001, (token) =>
    token ? console.info("Start success") : console.error("Start failure")
  );
}

run();
```

### with core package (better version)

```typescript
import uWS from "uWebSockets.js";

// extendApp - lets you use or write extensions, notFoundConstructor - send 404 with a message
import { extendApp, notFoundConstructor } from "@ublitzjs/core";

// all extensions will be typed in typescript, so server.run call is also typed.
const server = extendApp(
  uWS.App(),
  /* your extensions as a rest parameter. They will be bound to "server" */ {
    run(/*for typescript*/ this: Server) {
      this.listen(9001, (token) =>
        token ? console.info("Start success") : console.error("Start failure")
      );
    },
  } /*, you can put here as many as you want. */
);

server.any("/*", notFoundConstructor("Nothing to see here!"));

// use your extension
server.run();
```

And last example, just to show real-world use-case for extendApp

```typescript
import uWS from "uWebSockets.js";
import { extendApp, notFoundConstructor } from "@ublitzjs/core";

import { serverExtension as openapiExt } from "@ublitzjs/openapi";

const server = extendApp(
  uWS.App(),
  // this is very basic, so for better examples - go find source repo
  openapiExt({
    openapi: "3.0.0",
    info: {
      title: "Some ublitzjs server",
      version: "0.0.1",
    },
  }),
  // your extension can also be here
  {
    run(this: Server) {
      this.listen(9001, (token) =>
        token ? console.info("Start success") : console.error("Start failure")
      );
    },
  }
);
// this function is given by the extension
await server.serveOpenApi("/docs", { build: false, path: "openapi.json" });

server.any("/*", notFoundConstructor("Nothing to see here!"));

server.run();
```

So in extendApp you put "extensions", as I call them.

## With routers (mainly not @ublitzjs/router) and other imports

### two modules with core package

_main.js_

```typescript
import uWS from "uWebSockets.js";
import { extendApp } from "@ublitzjs/core";
import router from "./router.js";
const server = extendApp(uWS.App());
// register "plugins", not "extensions"
server.register(router);
server.listen(9001, () => {});
```

here you have imported your router and registered it as a plugin. So "extension" gives you NEW functionality, while "plugin" should use your current functionality

_router.js_

```typescript
import type { Server } from "@ublitzjs/core";
// for readability and
export default (server: Server) => {
  server.get("/simple", (res) => {
    res.end("hello");
  });
};
```

### example with @ublitzjs/router

_main.js_ - the same. Nothing changed at all <br>
_router.js_

```typescript
import type { Server } from "@ublitzjs/core";
import { Router } from "@ublitzjs/router";
// again - better explanations in source repo.
// Generally, router looks like OpenAPI
const router = new Router({
  // route
  "/simple": {
    // method
    get(res) {
      res.end("hello");
    },
  },
});
export default (server: Server) => {
  router.bind(server).define("/simple", "get");
};
```

So here I showed you how to setup a main file and split your code into modules

# Headers

## HeadersMap

This class is used to convert all headers to ArrayBuffers and quickly set them on each request.

```typescript
import { HeadersMap, definePlugin, toAB, type Server } from "@ublitzjs/core";
// init headers
const htmlHeaders = new HeadersMap({
  "Content-Type": "text/html",
});
// convert strings to ArrayBuffers -> it returns a function
const setHeaders = htmlHeaders.prepare();

export default (server: Server) => {
  const html = toAB("<h1>Hello</h1>");
  server.get("/", (res) => {
    // and this function returns "res" object
    setHeaders(res).end(html);
  });
};
```

Also there is HeadersMap.default (see in the code), HeadersMap.baseObj (also in the code), and HeadersMap.remove (you remove unwanted headers)

## setCSP

Creates a string of CSP, using array parameters.

```typescript
// in response (not recommended)
res.writeHeader(
  "Content-Security-Policy",
  setCSP({ "default-src": ["'self'"] })
);
// in HeadersMap
import { setCSP, HeadersMap, /*basic settings*/ CSPDirs } from "@ublitzjs";
new HeadersMap({
  "Content-Security-Policy": setCSP(
    {
      ...CSPDirs,
      "connect-src": ["'self'", "https://example.com"],
    },
    /*remove directives in a rest param*/
    "img-src",
    "object-src"
  ),
}).prepare();
```

## lowHeaders

Greatly fits when you need to use request.getHeader("sec-websocket-extensions"), but miss a letter or two. <br>
See example below in "uWS types / DocumentedWS and DocumentedWSBehavior"

# registerAbort

this utility lets you extend your handlers in a very asynchronous manner and nothing will ever brake.<br>
Emitter used here is "tseep", which is faster than node:events.

```typescript
import type { HttpResponse } from "@ublitzjs/core";
function myOnAbort(res: HttpResponse) {
  res.emitter.once("abort", () => {
    /*do something*/
  });
}
server.get("/", (res) => {
  // use it
  registerAbort(res);
  console.log(/*added on the response*/ res.aborted, res.emitter);

  res.emitter.once("abort", () => {
    console.log("ABORTED");
    // as an example
    stopDatabaseTransaction();
  });

  myOnAbort();
  /*here you something*/
});
```

It is heavily used in @ublitzjs/req-body and @ublitzjs/static to stop file streams
If you want a more interesting use-case, <a href="./examples/AsyncFunction.mts">Go here</a>

# uWS types

Another benefit of using this package are additional typescript docs for uWS, that they haven't added yet (I mean index.d.ts has no description yet).

## DeclarativeResponse

This class helps you define faster and more optimized controllers, because they are prebuilt before execution.<br>

Instead of sending response dynamically each time with <code>res.end()</code> you generate the whole response with all headers and body right on the start of the application.<br>

It is not something, that ublitzjs created (only <code>.writeHeaders</code> method), but rather just description it gives you with the class

```typescript
import { DeclarativeResponse } from "@ublitzjs";
server.get(
  "/fast-response",
  new Declarative()
    .writeHeader("Content-Type", "text/plain")
    /*spec method*/ .writeHeaders({ Allow: "GET" })
    .end("HI")
);
```

## DocumentedWS and DocumentedWSBehavior

These types add 3 methods to websocket object: sendFirstFragment, sendFragment, sendLastFragment.<br>
More detailed description <a href="./types/uws-types.d.ts">here</a>

```typescript
import type { extendApp, DocumentedWSBehavior, lowHeaders } from "@ublitzjs/core";
import uWS from "uWebSockets.js";
const server = extendApp(uWS.App()) // better for ts
server.ws("/*", {
  upgrade(res, req, context) {
    res.upgrade(
      { url: req.getUrl() },
      req.getHeader</*adds typescript support*/ lowHeaders>(
        "sec-websocket-key"
      ),
      req.getHeader<lowHeaders>("sec-websocket-protocol"),
      req.getHeader<lowHeaders>("sec-websocket-extensions"),
      context
    );
  },
  async open(ws) {
    ws.sendFirstFragment("hello1\n");
    ws.sendFragment("hello2\n");
    ws.sendLastFragment("end hello");
  },
  close(ws){
    //typed safety flag
    ws.closed = true;
  }
  message(ws){
    setTimeout(()=>{
      //acts like res.aborted
      if(ws.closed) return;
      ws.send("hello")
    }, 100);
  },
});
```

# Bundling

Best efficiency and start time can be achieved if the code is bundled and minified.<br>
For this purpose you can use "esbuild" (at least it was tested and worked for both cjs and esm formats).<br>
The only thing to remember: when you use it for bundling, don't forget to put "uWebSockets.js" to "external" array.<br>
<a href="./examples/esbuild.mjs">Example 1</a><br>
<a href="./tests/esbuild.test.ts">Dynamic example 2</a>
