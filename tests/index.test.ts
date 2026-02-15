import runTests from "./abstraction"
import {createRequire} from "node:module"
var require = createRequire(import.meta.url);


await runTests(["uWebSockets.js"], [
  {
    normalCJS: require("@ublitzjs/core"),
    normalESM: await import("@ublitzjs/core"),
    test: "runDefault",
    name: "index.js"
  },
])
