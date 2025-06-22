![μBlitz.js](./logo.png)
<br/>

# μBlitz.js - utility-library for uWebSockets.js

On NPM you can find such packages:

- @ublitzjs/core (THIS repo)
- @ublitzjs/logger (colorful console)
- @ublitzjs/static (send files)
- @ublitzjs/payload (handling POST-like requests)
- @ublitzjs/router (OpenAPI-like router for simple orientation)
- @ublitzjs/openapi
- @ublitzjs/dev-comments (Tool for removing CODE BETWEEN /\*\_START_DEV\_\*/ and /\*\_END_DEV\_\*/ comments)

# Installation

```ps1
npm install "@ublitzjs/core"
```

Or with bun. Or whatever.

# Preferences

Supports CJS and ESM in ALL packages

# <a href="./USAGE.md" target="_blank">Go to usage.md</a>

# Comparison with others

It is acclaimed, that Express.js, Fastify, and other frameworks are built to be very extensible and developer-friendly. It is enough to download needed packages, put them as middlewares, which handle everything behind the scenes, and do your own job. <br>

But the "speed" of creating your app comes from so-called "abstractions". Their versatility is often considered an "overkill" and they usually overwhelm the RAM and slow down your app. Most people, however, still prefer "rapid typing" over speed of execution, under which I mean uWebSocket.js (which actually handles websockets AND http requests)<br>

Though it IS performant, it handles only core features. Now there are solutions like "hyper-express", "ultimate-express", "uwebsockets-express", but they are just abstractions, created to be somehow faster then express, but hide the most important (and difficult) aspects of uWS.<br>

This library is different. It doesn't take care of everything, but rather helps you do it yourself, using utilities.
