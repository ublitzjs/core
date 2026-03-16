import runTests from "./abstraction"
//import {createRequire} from "node:module"
// var require = createRequire(import.meta.url);


await runTests(["uWebSockets.js"], [
  //{
  //  normalCJS: require("@ublitzjs/core"),
  //  normalESM: await import("@ublitzjs/core"),
  //  test: "testIndex",
  //  name: "index.js"
  //},
  {
    //normalCJS: require("@ublitzjs/core/events"),
    normalESM: await import("@ublitzjs/core/events"),
    test: "testChannel",
    //name: "events.js"
  }
])
