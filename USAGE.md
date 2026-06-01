> Everything works for TypeScript, ESM, CJS, Bundled and minified versions with ESBuild
# Extensions and plugins
_index.ts_

```TypeScript
// this is an index.ts 
import { extendApp } from "@ublitzjs/core"
import { App } from "uwsjs-fork"
import someRoutes from "./routes"
var server = extendApp(
    App(),
    // extension 1, type is dynamically inferred
    { log: console.log },
    // another extension
    { PORT: 9001 } 
)

// inspired by Fastify
server.register(someRoutes)

// every property becomes dynamically typed - LSP is a blessing
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

# Channel and regAbort
"regAbort" is a utility, that lets you extend "res.onAborted" in a "pub/sub" style. It is done using "Channel" class from @ublitzjs/channel. "regAbort" registers "res.aborted" flag and "res.abortCh", which is a Channel instance.

```typescript
server.get('/', (res)=>{
  res.aborted === undefined // true
  res.abortCh === undefined // true

  regAbort(res);
  res.aborted === false;
  function onAb() { console.log("aborted"); }

  res.abortCh.sub_unique(onAb);
  // typeof onAb.id == number

  setTimeout(()=>{
    if(!res.aborted) { // you need to check, otherwise uWS drops server
      res.abortCh.unsub_unique(onAb); // O(1) lookup with onAb.id
      res.end("HOORAY")
    }
  }, 1000)
})
```
# Bundling
Each of the dependencies has been tested to pass ESBuild minification, but to bundle @ublitzjs/core you have to either exclude "uwsjs-fork", or exclude "*.node" and carry the specific binary with JS file in the same folder
