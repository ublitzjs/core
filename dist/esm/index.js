"use strict";
import uWS from "uWebSockets.js";
import { Buffer } from "node:buffer";
import { EventEmitter } from "tseep";
uWS.DeclarativeResponse.prototype.writeHeaders = function (headers) {
    for (const key in headers)
        this.writeHeader(key, headers[key]);
    return this;
};
/**
 * function to effortlessly mark response as aborted AND to attach an event emitter, so that you can easily scale the handler. If you don't need event emitter and only some res.aborted - set it by yourself (no overkill for the handler)
 * @param res
 */
export function registerAbort(res) {
    if (typeof res.aborted === "boolean")
        throw new Error("abort already registered");
    res.aborted = false;
    res.emitter = new EventEmitter();
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
export var closure = (param) => param();
/**
 * extends uWS.App() or uWS.SSLApp. See interface Server
 * @param app uWS.App()
 */
export function extendApp(app, ...rest) {
    app.register = function (plugin) {
        return plugin(this), this;
    };
    app.onError = function (fn) {
        return (this._errHandler = fn), this;
    };
    app._startPromises = [];
    app.awaitLater = function () {
        this._startPromises.push(...arguments);
    };
    app.ready = function () {
        return Promise.all(this._startPromises).then(() => (this._startPromises = []));
    };
    app.route = function (opts, plugins) {
        if (plugins)
            for (const p of plugins)
                p(opts, this);
        return this[opts.method](opts.path, opts.controller);
    };
    for (const extension of rest)
        Object.assign(app, extension);
    return app;
}
/**
 * conversion to ArrayBuffer ('cause transferring strings to uWS is really slow)
 */
export function toAB(data) {
    var NodeBuf = data instanceof Buffer ? data : Buffer.from(data);
    return NodeBuf.buffer.slice(NodeBuf.byteOffset, NodeBuf.byteOffset + NodeBuf.byteLength);
}
/**
 * Almost nothing different from uWS.DeclarativeResponse. The only modification - writeHeaders method (several methods, typescript intellisense)
 */
export var DeclarativeResponse = uWS.DeclarativeResponse;
export * from "./http-codes.js";
export * from "./http-headers.js";
