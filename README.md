![μBlitz.js](./logo.png)
<br/>

# μBlitz.js - utilitarian-library for uWebSockets.js

On NPM you can find such packages: (with @ublitzjs/ organization)

- core (THIS repo)
- logger (colorful console)
- static (send files)
- payload (handling POST-like requests)
- router (OpenAPI-like router for simple orientation)
- openapi
- preprocess (Code preprocessing + templating framework)
- asyncapi
- testing (coming soon)
- auth (coming soon)

# Installation

```ps1
npm install "@ublitzjs/core"
```

Or with bun. Or whatever.

# Preferences

Supports CJS and ESM in ALL packages

# <a href="./USAGE.md" target="_blank">Go to usage.md</a>

# But why?

It is acclaimed that Express.js, Fastify and other frameworks are built to be very extensible and developer-friendly. It is enough to download needed packages, put them as middlewares, which handle everything behind the scenes, and do your own job. <br>

But the "speed" of creating your app comes from so-called "abstractions". Their versatility is often considered to be an "overkill" as they usually overwhelm the RAM and slow down your app. Most people, however, still prefer "rapid typing" over speed of execution, under which I mean uWebSockets.js (which actually handles websockets AND http requests)<br>

Though it IS performant, it handles only core features. Now there are solutions like "hyper-express", "ultimate-express", "uwebsockets-express", but they are just additional layers simulating "express" behaviour, while hiding the most important (and difficult) aspects of uWS.<br>

This library provides you with utilities but you still operate on the uWebSockets.js. This way server remains optimizable and rapid typing doesn't vanish.
