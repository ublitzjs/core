"use strict";
import uWS from "uWebSockets.js";
import {
  extendApp,
  DeclarativeResponse,
  notFoundConstructor,
} from "../../mjs/index.mjs";
var app = extendApp(uWS.App());
app.any("/*", notFoundConstructor("Mr. Someone. You've mistaken the link"));
/**
 * @param {number} port
 */
export default (port) =>
  new Promise((resolve, reject) => {
    app.listen(port, (token) => {
      if (token) resolve(token);
      else reject(new Error("Didn't start"));
    });
  });
