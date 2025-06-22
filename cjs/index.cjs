"use strict";
var uWS = require("uWebSockets.js");
var { Buffer } = require("node:buffer");

var { EventEmitter } = require("tseep");
function registerAbort(res) {
  if (typeof res.aborted === "boolean")
    throw new Error("abort already registered");
  res.aborted = false;
  res.emitter = new EventEmitter();
  return res.onAborted(() => {
    res.aborted = true;
    res.emitter.emit("abort");
  });
}
var closure = (param) => param();
function extendApp(app, ...rest) {
  app.register = function (plugin) {
    return plugin(this), this;
  };
  app.onError = function (fn) {
    return (this._errHandler = fn), this;
  };
  app._startPromises = [];
  app.ready = function () {
    return Promise.all(this._startPromises).then(
      () => (this._startPromises = [])
    );
  };
  app.route = function (opts, plugins) {
    if (plugins) for (const p of plugins) p(opts, this);
    return this[opts.method](opts.path, opts.controller);
  };
  for (const extension of rest) Object.assign(app, extension);
  return app;
}
function toAB(data) {
  var NodeBuf = data instanceof Buffer ? data : Buffer.from(data);
  return NodeBuf.buffer.slice(
    NodeBuf.byteOffset,
    NodeBuf.byteOffset + NodeBuf.byteLength
  );
}
var DeclarativeResponse = uWS.DeclarativeResponse;
DeclarativeResponse.prototype.writeHeaders = function (headers) {
  for (const key in headers) this.writeHeader(key, headers[key]);
  return this;
};

module.exports = {
  DeclarativeResponse,
  extendApp,
  registerAbort,
  toAB,
  closure,
};
Object.assign(
  module.exports,
  require("./http-headers.cjs"),
  require("./http-codes.cjs")
);
