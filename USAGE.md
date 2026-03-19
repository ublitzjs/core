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

# Channel and regAbort
"regAbort" is a utility (don't confuse with registerAbort which is deprecated), that lets you extend "res.onAborted" in a "pub/sub" style. It is done using "Channel" class. "regAbort" registers "res.aborted" flag and "res.abortCh", which is a Channel instance, to which you can subscribe listeners and remove them by one, or all at once. 

```typescript
server.get('/', (res)=>{
  res.aborted === undefined // true
  res.abortCh === undefined // true

  regAbort(res);
  res.aborted === false;
  function onAb() { console.log("aborted"); }
  res.abortCh.sub(onAb);

  setTimeout(()=>{
    if(!res.aborted) { // you need to check, otherwise uWS drops server
      res.abortCh.unsub(onAb); // O(1) lookup
      res.end("HOORAY")
    }
  }, 1000)
})
```
Before there was a "registerAbort" which registered "res.emitter" ("tseep" instance). However it appeared to spend excessive time on creation (new EventEmitter). Even though it cleverly generates "emit" handler for "on" callbacks, the very generation also takes time (which is tested in benchmarks in this repo).
There is also a "cozyevent" emitter with fast creation, however its "emit" function is slower than of "node:events". 
Standard "node:events" is mostly sufficient, however removing elements is not that fast.

To address given issues I have created "Channel" (example above) and benchmarked it. You can view the results in GitHub Actions in https://github.com/ublitzjs/core repo. They are usually the same. Test file is "tests/ch-bench.mjs". To run it manually use "bun run test:channel". For testing I used "tinybench", however in one case it lied to me (tseep safe - see tests/tseepSafeBench.ts). 

creation time as of empty class
┌─────────┬───────────┬──────────────────┬──────────────────┬────────────────────────┬────────────────────────┬──────────┐
│ (index) │ Task name │ Latency avg (ns) │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples  │
├─────────┼───────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┼──────────┤
│ 0       │ 'empty'   │ '45.01 ± 0.12%'  │ '40.00 ± 0.00'   │ '22771616 ± 0.00%'     │ '25000000 ± 0'         │ 22218731 │
│ 1       │ 'channel' │ '45.28 ± 0.06%'  │ '41.00 ± 1.00'   │ '22602233 ± 0.00%'     │ '24390244 ± 609756'    │ 22082547 │
└─────────┴───────────┴──────────────────┴──────────────────┴────────────────────────┴────────────────────────┴──────────┘
adding 10 listeners + removeAllListeners
┌─────────┬───────────────┬───────────────────┬──────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name     │ Latency avg (ns)  │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼───────────────┼───────────────────┼──────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'tseep'       │ '410.36 ± 19.41%' │ '351.00 ± 1.00'  │ '2814167 ± 0.01%'      │ '2849003 ± 8140'       │ 2436888 │
│ 1       │ 'channel'     │ '102.96 ± 8.30%'  │ '90.00 ± 0.00'   │ '10773903 ± 0.00%'     │ '11111111 ± 0'         │ 9712395 │
│ 2       │ 'node:events' │ '402.00 ± 27.74%' │ '321.00 ± 1.00'  │ '3054661 ± 0.01%'      │ '3115265 ± 9735'       │ 2487563 │
│ 3       │ 'cozy'        │ '244.27 ± 0.53%'  │ '260.00 ± 39.00' │ '4285139 ± 0.02%'      │ '3846154 ± 523895'     │ 4093762 │
└─────────┴───────────────┴───────────────────┴──────────────────┴────────────────────────┴────────────────────────┴─────────┘
adding 10 listeners + remove individually
┌─────────┬───────────────┬──────────────────┬──────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name     │ Latency avg (ns) │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼───────────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'channel'     │ '187.94 ± 0.05%' │ '181.00 ± 1.00'  │ '5381538 ± 0.00%'      │ '5524862 ± 30694'      │ 5320921 │
│ 1       │ 'tseep'       │ '699.99 ± 0.07%' │ '691.00 ± 10.00' │ '1446506 ± 0.01%'      │ '1447178 ± 21251'      │ 1428597 │
│ 2       │ 'node:events' │ '751.73 ± 0.39%' │ '732.00 ± 1.00'  │ '1354621 ± 0.01%'      │ '1366120 ± 1869'       │ 1330263 │
│ 3       │ 'cozy'        │ '802.94 ± 0.43%' │ '791.00 ± 41.00' │ '1285092 ± 0.01%'      │ '1264222 ± 67335'      │ 1245430 │
└─────────┴───────────────┴──────────────────┴──────────────────┴────────────────────────┴────────────────────────┴─────────┘
1 listener publish (+ 'this' context) as without emitter
┌─────────┬───────────┬──────────────────┬──────────────────┬────────────────────────┬────────────────────────┬──────────┐
│ (index) │ Task name │ Latency avg (ns) │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples  │
├─────────┼───────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┼──────────┤
│ 0       │ 'nothing' │ '44.88 ± 0.06%'  │ '40.00 ± 0.00'   │ '22779923 ± 0.00%'     │ '24999996 ± 5'         │ 22282670 │
│ 1       │ 'channel' │ '47.70 ± 0.06%'  │ '50.00 ± 0.00'   │ '21392228 ± 0.00%'     │ '20000002 ± 3'         │ 20964237 │
└─────────┴───────────┴──────────────────┴──────────────────┴────────────────────────┴────────────────────────┴──────────┘
'unrealistic' constant 'emit' with no add/remove
┌─────────┬───────────────┬──────────────────┬──────────────────┬────────────────────────┬────────────────────────┬──────────┐
│ (index) │ Task name     │ Latency avg (ns) │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples  │
├─────────┼───────────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┼──────────┤
│ 0       │ 'channel'     │ '58.72 ± 0.12%'  │ '60.00 ± 0.00'   │ '17418480 ± 0.00%'     │ '16666669 ± 4'         │ 17028785 │
│ 1       │ 'tseep'       │ '46.47 ± 0.06%'  │ '50.00 ± 1.00'   │ '22005431 ± 0.00%'     │ '20000005 ± 392160'    │ 21518854 │
│ 2       │ 'node:events' │ '95.97 ± 17.73%' │ '90.00 ± 1.00'   │ '11687028 ± 0.00%'     │ '11111113 ± 124841'    │ 10419873 │
│ 3       │ 'cozy'        │ '70.41 ± 23.45%' │ '60.00 ± 0.00'   │ '16491028 ± 0.00%'     │ '16666665 ± 4'         │ 14202596 │
└─────────┴───────────────┴──────────────────┴──────────────────┴────────────────────────┴────────────────────────┴──────────┘
3 constant listeners, add/remove 1 listener each '5 emit calls'
┌─────────┬───────────────┬───────────────────┬──────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name     │ Latency avg (ns)  │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼───────────────┼───────────────────┼──────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'channel'     │ '173.92 ± 0.06%'  │ '170.00 ± 0.00'  │ '5819000 ± 0.00%'      │ '5882353 ± 0'          │ 5749864 │
│ 1       │ 'tseep'       │ '1128.3 ± 15.95%' │ '962.00 ± 10.00' │ '1027142 ± 0.01%'      │ '1039501 ± 10919'      │ 886297  │
│ 2       │ 'node:events' │ '466.19 ± 0.65%'  │ '441.00 ± 0.00'  │ '2245658 ± 0.01%'      │ '2267574 ± 0'          │ 2145046 │
│ 3       │ 'cozy'        │ '216.76 ± 2.73%'  │ '201.00 ± 1.00'  │ '4894540 ± 0.01%'      │ '4975125 ± 24875'      │ 4613363 │
└─────────┴───────────────┴───────────────────┴──────────────────┴────────────────────────┴────────────────────────┴─────────┘
'once' listeners (for Channel - just .clear())
┌─────────┬───────────────┬───────────────────┬──────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name     │ Latency avg (ns)  │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼───────────────┼───────────────────┼──────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'tseep'       │ '115.37 ± 2.24%'  │ '110.00 ± 0.00'  │ '9014256 ± 0.00%'      │ '9090908 ± 1'          │ 8667727 │
│ 1       │ 'channel'     │ '242.97 ± 14.31%' │ '220.00 ± 1.00'  │ '4564661 ± 0.01%'      │ '4545455 ± 20568'      │ 4115795 │
│ 2       │ 'node:events' │ '1154.7 ± 16.22%' │ '982.00 ± 10.00' │ '1007810 ± 0.01%'      │ '1018330 ± 10477'      │ 866018  │
│ 3       │ 'cozy'        │ '976.16 ± 3.53%'  │ '922.00 ± 50.00' │ '1091911 ± 0.02%'      │ '1084599 ± 55792'      │ 1024421 │
└─────────┴───────────────┴───────────────────┴──────────────────┴────────────────────────┴────────────────────────┴─────────┘
1000 listeners add/remove individually
┌─────────┬───────────────┬───────────────────┬────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name     │ Latency avg (ns)  │ Latency med (ns)   │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼───────────────┼───────────────────┼────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'channel'     │ '15280 ± 0.06%'   │ '15119 ± 21.00'    │ '65695 ± 0.04%'        │ '66142 ± 92'           │ 65444   │
│ 1       │ 'tseep'       │ '1030999 ± 0.17%' │ '1026963 ± 1032.0' │ '970 ± 0.12%'          │ '974 ± 1'              │ 970     │
│ 2       │ 'node:events' │ '1059327 ± 0.09%' │ '1055917 ± 2420.0' │ '944 ± 0.08%'          │ '947 ± 2'              │ 944     │
│ 3       │ 'cozy'        │ '2513254 ± 0.39%' │ '2476245 ± 41236'  │ '398 ± 0.37%'          │ '404 ± 7'              │ 398     │
└─────────┴───────────────┴───────────────────┴────────────────────┴────────────────────────┴────────────────────────┴─────────┘
mixed creation + listeners + emit
┌─────────┬───────────────┬───────────────────┬──────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name     │ Latency avg (ns)  │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼───────────────┼───────────────────┼──────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'tseep'       │ '1086.8 ± 0.29%'  │ '1052.0 ± 10.00' │ '941719 ± 0.01%'       │ '950570 ± 9123'        │ 920127  │
│ 1       │ 'channel'     │ '160.00 ± 2.52%'  │ '150.00 ± 1.00'  │ '6487070 ± 0.00%'      │ '6666666 ± 44149'      │ 6250125 │
│ 2       │ 'node:events' │ '595.89 ± 29.28%' │ '451.00 ± 1.00'  │ '2172147 ± 0.01%'      │ '2217295 ± 4927'       │ 1678169 │
│ 3       │ 'cozy'        │ '290.17 ± 7.25%'  │ '261.00 ± 1.00'  │ '3757644 ± 0.01%'      │ '3831418 ± 14736'      │ 3446266 │
└─────────┴───────────────┴───────────────────┴──────────────────┴────────────────────────┴────────────────────────┴─────────┘

## EventEmitter (I don't recommend it)
It was not created as the main goal (hence is slower than alternatives), so you would rather avoid it and use Channel alone.


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
