"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  registerAbort: true,
  closure: true,
  extendApp: true,
  toAB: true,
  DeclarativeResponse: true
};
exports.closure = exports.DeclarativeResponse = void 0;
exports.extendApp = extendApp;
exports.registerAbort = registerAbort;
exports.toAB = toAB;
var _uWebSockets = require("uWebSockets.js");
var _nodeBuffer = require("node:buffer");
var _tseep = require("tseep");
var _httpCodes = require("./http-codes.js");
Object.keys(_httpCodes).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _httpCodes[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _httpCodes[key];
    }
  });
});
var _httpHeaders = require("./http-headers.js");
Object.keys(_httpHeaders).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _httpHeaders[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _httpHeaders[key];
    }
  });
});
_uWebSockets.DeclarativeResponse.prototype.writeHeaders = function (headers) {
  for (const key in headers) this.writeHeader(key, headers[key]);
  return this;
};
/**
 * function to effortlessly mark response as aborted AND to attach an event emitter, so that you can easily scale the handler. If you don't need event emitter and only some res.aborted - set it by yourself (no overkill for the handler)
 * @param res
 */
function registerAbort(res) {
  if (typeof res.aborted === "boolean") throw new Error("abort already registered");
  res.aborted = false;
  res.emitter = new _tseep.EventEmitter();
  return res.onAborted(() => {
    res.aborted = true;
    res.emitter.emit("abort");
  });
}
;
/**
 * Utility for making closures. Exists for organizing code and caching values in non-global scope.
 * @param param
 * @returns what you passed
 */
var closure = param => param();
/**
 * extends uWS.App() or uWS.SSLApp. See interface Server
 * @param app uWS.App()
 */
exports.closure = closure;
function extendApp(app, ...rest) {
  app.register = function (plugin) {
    return plugin(this), this;
  };
  app.onError = function (fn) {
    return this._errHandler = fn, this;
  };
  app._startPromises = [];
  app.awaitLater = function () {
    this._startPromises.push(...arguments);
  };
  app.ready = function () {
    return Promise.all(this._startPromises).then(() => this._startPromises = []);
  };
  app.route = function (opts, plugins) {
    if (plugins) for (const p of plugins) p(opts, this);
    return this[opts.method](opts.path, opts.controller);
  };
  for (const extension of rest) Object.assign(app, extension);
  return app;
}
/**
 * conversion to ArrayBuffer ('cause transferring strings to uWS is really slow)
 */
function toAB(data) {
  var NodeBuf = data instanceof _nodeBuffer.Buffer ? data : _nodeBuffer.Buffer.from(data);
  return NodeBuf.buffer.slice(NodeBuf.byteOffset, NodeBuf.byteOffset + NodeBuf.byteLength);
}
/**
 * Almost nothing different from uWS.DeclarativeResponse. The only modification - writeHeaders method (several methods, typescript intellisense)
 */
var DeclarativeResponse = exports.DeclarativeResponse = _uWebSockets.DeclarativeResponse;