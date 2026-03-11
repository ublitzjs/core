> Everything works for TypeScript, ESM, CJS, Bundled and minified versions with ESBuild
# Extensions and plugins
_index.ts_
```typescript
// this is an index.ts 
import { extendApp } from "@ublitzjs/core"
import { App } from "uWebSockets.js"
import someRoutes from "./routes"
var server = extendApp(
    App(),
    // extension 1, type is dynamically inferred
    { log: console.log },
    // another extension
    { PORT: 9001 } 
)

// thanks Fastify for motivation
server.register(someRoutes)

// every property becomes dynamically typed. No need for @ublitzjs/core to create types for your features.
server.listen(server.PORT, (socket)=>{
    if(socket) server.log("listening")
    else server.log("something failed")
})
export type serverType = typeof server // in case you want to use that server somewhere

```
_routes.ts_
```typescript
import type {serverType} from "./index"

export default function(server: serverType) {
    server.get("/", (res)=>res.end("ok"))
}
```

# Headers

In previous versions there was a "HeadersMap" which used to convert all non-changing headers into ArrayBuffer instances, however the benefit was too little, so now it is deprecated. The main overhead for headers turned out to come from "res.writeHeader". So instead of writing one header pair in each call, it is better to write several ones in one using CRLF. While it is faster, it is less safe and looks frightening. So when http headers don't change, you can use beautiful "staticHeaders"
Also there is _lowHeaders_, _setCSP_, typed _res.writeHeader_, typed _req.getHeader + lowHeaders_, _parseRange_ (mainly used with @ublitzjs/static). You can explore more, as there many exported types for headers with full descriptions and internet links

```typescript
import { staticHeaders, extendApp, setCSP, type lowHeaders, parseRange } from "@ublitzjs/core"
import { App } from "uWebSockets.js"

var server = extendApp(App())

//if all headers don't change, typeof headers == "string"
var headers = staticHeaders({
  // headers are typed,
  "Content-Type": "text/plain", 

  // again, typed header + typed CSP directives
  "Content-Security-Policy": setCSP({
    "connect-src": ["'self'"],
    "worker-src": ["'self'"]
  })

}, "Etag") // However "Etag" doesn't have value yet

// you can also use staticHeaders({...helmetHeaders, "Content-Type": "text/plain"}, "ETag") for usage with default helmet headers
var littleFasterHeaders = Buffer.from(headers)
server.get("/", (res, req)=>{
    

  // we put ETag's value to the right. This way we can combine static + dynamic headers in one single call  
  res.writeHeader(littleFasterHeaders, 'W/"' + 123 + '"')  

  // underneath this is the same (gain speed but lose TypeScript. Not bad if your head is a compiler or you write tests)
  res.writeHeader(
    "Content-Type: text/plain\r\nETag",
    'W/"' + 123 + '"'
  )

  // you can make right side look same as well, but have to switch off validation with <string>
  res.writeHeader<string>(
    "Content-Type",
    'text/plain\r\nETag: W/"' + 123 + '"'
  )

  // get headers with lowHeaders, so that "range" is proposed by LSP (no need to be explicit, this is here by default). You can still use Buffer/ArrayBuffer
  var rangeHeader = req.getHeader<lowHeaders>("range")
  if(rangeHeader) {
    // max send 50 bytes, last byte is at index 100
    const parsedRange = parseRange(rangeHeader, 100, 50)
    if(parsedRange.ok) {
      console.log(parsedRange.start, parsedRange.end)
    } else console.log(parsedRange.code) // "400" or "416"
  }
  res.end("ok")  
})

```

# registerAbort

this utility lets you extend your handlers in a very asynchronous manner and nothing will ever brake.<br>
Emitter used here is "tseep", which is faster than node:events.

```typescript
import type { HttpResponse } from "@ublitzjs/core";
function someHeavyHandler(res: HttpResponse) {
  console.log("I DO SOMETHING LARGE, LIKE STREAMING VIDEO")
  return new Promise<boolean>((resolve)=>{
    res.emitter.once("abort", () => {
      /*close file descriptor*/
      resolve(false);
    });
    setTimeout(()=>{
      if(!res.aborted) { console.log("HAVE SENT FILE"); resolve(true) }
    }, 1000)
  })
}
server.get("/", (res) => {
  registerAbort(res);
  console.log(/*added on the response*/ res.emitter);

  res.emitter.once("abort", () => {
    console.log("ABORTED");
    // as an example
    stopDatabaseTransaction();
  });

  // easily cleans up if aborted
  var haveSentFile = await someHeeavyHandler(res);
});
```

It is heavily used in @ublitzjs/static to stop file streams

# TypeScript support

Another benefit of using this package are additional typescript docs (and some for uWS, that they haven't added yet)

## DeclarativeResponse

This class helps you define faster and more optimized controllers, because they are prebuilt before execution.<br>

Instead of sending response dynamically each time with <code>res.end()</code> you generate the whole response with all headers and body right on the start of the application.<br>

It is not something, that µBlitz.js created (only <code>.writeHeaders</code> method), but rather just description it gives you with the class

```typescript
import { DeclarativeResponse } from "@ublitzjs/core";
server.get(
  "/fast-response",
  new Declarative()
    .writeHeader("Content-Type", "text/plain")
    /*spec method*/ .writeHeaders({ Allow: "GET" })
    .end("HI")
);
```

## DocumentedWS and DocumentedWSBehavior
> soon these types will be present in the very uWS
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
For this purpose you can use "ESbuild" (at least it was tested and it worked for both cjs and esm).<br>
The only thing to remember: when you use it for bundling, don't forget to put "uWebSockets.js" to "external" array.<br>
