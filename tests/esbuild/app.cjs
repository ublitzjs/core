"use strict";
var uWS = require("uWebSockets.js");
var {
  extendApp,
  DeclarativeResponse,
  notFoundConstructor,
} = require("../../cjs/index.cjs");
var app = extendApp(uWS.App());
app.any("/*", notFoundConstructor("Mr. Someone. You've mistaken the link"));
/**
 * @param {number} port
 */
module.exports = (port) =>
  new Promise((resolve, reject) => {
    app.listen(port, (token) => {
      if (token) resolve(token);
      else reject(new Error("Didn't start"));
    });
  });
