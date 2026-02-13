"use strict";
import type { BaseHeaders, lowHeaders } from "./http-headers.js";
import uWS from "uWebSockets.js";
import { Buffer } from "node:buffer";
import { EventEmitter } from "tseep";
(uWS as any).DeclarativeResponse.prototype.writeHeaders = function (headers: any) {
  for (const key in headers) this.writeHeader(key, headers[key]);
  return this;
};


import type {
  CompressOptions,
  WebSocket,
  HttpRequest as uwsHttpRequest,
  TemplatedApp,
  HttpResponse as uwsHttpResponse,
  RecognizedString,
  us_socket_context_t,
} from "uWebSockets.js";

/**
 * function to effortlessly mark response as aborted AND to attach an event emitter, so that you can easily scale the handler. If you don't need event emitter and only some res.aborted - set it by yourself (no overkill for the handler)
 * @param res
 */
export function registerAbort(res: uwsHttpResponse): HttpResponse {
  if (typeof res.aborted === "boolean")
    throw new Error("abort already registered");
  res.aborted = false;
  res.emitter = new EventEmitter();
  return res.onAborted(() => {
    res.aborted = true;
    res.emitter.emit("abort");
  }) as HttpResponse;
};
/**
 * An extended version of uWS.App . It provides you with several features:
 * 1) plugin registration (just like in Fastify);
 * 2) "ready" function and _startPromises array (use it to make your code more asynchronous and safe)
 * 3) "route" function for more descriptive adn extensible way of registering handlers
 * 4) "onError" function (mainly used by @ublitzjs/router)
 */
export interface Server extends TemplatedApp {
  /**
   * It is same as plugins in Fastify -> you register some functionality in separate function
   * @param plugin
   * @returns itself (for chaining methods)
   */
  register(plugin: (server: this) => void): this;
  /** set global _errHandler (in fact it is used only by @ublitzjs/router) */
  onError(fn: (error: Error, res: HttpResponse, data: any) => any): this;
  _errHandler?(error: Error, res: HttpResponse, data: any): any;
  /**some undocumented property in uWS - get it here */
  addChildAppDescriptor(...any: any[]): this;
  /**a function, which pushes promises to be awaited using "await server.ready()"*/
  awaitLater(...promises: Promise<any>[]): void;
  /**a function, which awaits all promises inside _startPromises array and then clears it*/
  ready: () => Promise<any[]>;
  /**
   * simple array of promises. You can push several inside and await all of them using server.ready() method
   */
  _startPromises: Promise<any>[];
  /**
   * this function allows you to create new handlers but more dynamically than uWS. Best use case - development. By default, the first param you pass includes a method, path, and a controller. However you can configure it for additional properties, which can be consumed on startup by second param - plugins
   * @example
   * server.route<onlyHttpMethods, {deprecated:boolean}>({
   *   method:"any",
   *   path: "/",
   *   controller(res){ res.end("hello") },
   *   deprecated:true
   * },
   * [
   *   (opts)=>{
   *     if(opts.deprecated) console.error("DEPRECATION FOUND", opts.path)
   *   }
   * ])
   */
  route<T extends HttpMethods, obj extends object = {}>(
    opts: routeFNOpts<T> & obj,
    plugins?: ((param: typeof opts, server: this) => void)[]
  ): this;
  get(pattern: RecognizedString, handler: HttpControllerFn): this;
  post(pattern: RecognizedString, handler: HttpControllerFn): this;
  options(pattern: RecognizedString, handler: HttpControllerFn): this;
  del(pattern: RecognizedString, handler: HttpControllerFn): this;
  patch(pattern: RecognizedString, handler: HttpControllerFn): this;
  put(pattern: RecognizedString, handler: HttpControllerFn): this;
  head(pattern: RecognizedString, handler: HttpControllerFn): this;
  connect(pattern: RecognizedString, handler: HttpControllerFn): this;
  trace(pattern: RecognizedString, handler: HttpControllerFn): this;
  any(pattern: RecognizedString, handler: HttpControllerFn): this;
  ws<UserData>(pattern: RecognizedString, behavior: DocumentedWSBehavior<UserData>) : this;
}
export type routeFNOpts<T extends HttpMethods> = {
  method: T;
  path: RecognizedString;
  controller: T extends "ws" ? DocumentedWSBehavior<any> : HttpControllerFn;
};

/**
 * Utility for making closures. Exists for organizing code and caching values in non-global scope.
 * @param param
 * @returns what you passed
 */
export var closure = <T>(param: () => T): T => param() ;
/**
 * little more typed response which has:
 * 1) "emitter", that comes from "tseep" package
 * 2) "aborted" flag
 * 3) "finished" flag
 * 4) "collect" function, which comes from original uWS (and isn't documented), but the purpose remains unknown
 * 5) "upgrade" function, though comes from original uWS, must not contain any names, which "DocumentedWS" has (or websocket object). ws.getUserData() return "ws" itself, so setting any data, which overlaps with already existing will impact your workflow. µBlitz.js doesn't add any lsp help here because it will brake "extends uwsHttpResponse" part.
 */
export interface HttpResponse<UserDataForWS = {}>
  extends uwsHttpResponse {
  upgrade<UserData = UserDataForWS>(
    userData: UserData,
    secWebSocketKey: RecognizedString,
    secWebSocketProtocol: RecognizedString,
    secWebSocketExtensions: RecognizedString,
    context: us_socket_context_t
  ): void;
  /**
   * This method actually exists in original uWebSockets.js, but is undocumented. I'll put it here for your IDE to be happy
   */
  collect: (...any: any[]) => any;
  /**
   * An event emitter, which lets you subscribe several listeners to "abort" event OR your own events, defined with Symbol().
   */
  emitter: EventEmitter<{
    abort: () => void;
    [k: symbol]: (...any: any[]) => void;
  }>;
  /**
   * changes when res.onAborted fires.
   */
  aborted?: boolean;
  /**
   * You should set it manually when ending the response. Particularly useful if some error has fired and you are doubting whether res.aborted is a sufficient flag.
   */
  finished?: boolean;
}
/**This HttpRequest is same as original uWS.HttpRequest, but getHeader method is typed for additional tips
 * @example
 * import {lowHeaders} from "@ublitzjs/core"
 * // some handler later
 * req.getHeader<lowHeaders>("content-type")
 */
export interface HttpRequest extends uwsHttpRequest {
  getHeader<T extends RecognizedString = lowHeaders>(a: T): string;
}

export type HttpControllerFn = (
  res: HttpResponse,
  req: HttpRequest
) => any | Promise<any>;
/**
 * only http methods without "ws"
 */
export type onlyHttpMethods =
  | "get"
  | "post"
  | "del"
  | "patch"
  | "put"
  | "head"
  | "trace"
  | "options"
  | "connect"
  | "any";
/**
 * all httpMethods with "ws" method
 */
export type HttpMethods = onlyHttpMethods | "ws"; //NOT A HTTP METHOD, but had to put it here
type MergeObjects<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First & MergeObjects<Rest extends any[] ? Rest : []>
  : {};
/**
 * extends uWS.App() or uWS.SSLApp. See interface Server
 * @param app uWS.App()
 */
export function extendApp<T extends object[]>(
  app: TemplatedApp,
  ...rest: T
): Server & MergeObjects<T> {
  (app as any).register = function (plugin: any) {
    return plugin(this), this;
  };
  (app as any).onError = function (fn: any) {
    return (this._errHandler = fn), this;
  };
  (app as any)._startPromises = [];
  (app as any).awaitLater = function(){
    this._startPromises.push(...arguments);
  };
  (app as any).ready = function () {
    return Promise.all(this._startPromises).then(
      () => (this._startPromises = [])
    );
  };
  (app as any).route = function (opts: any, plugins: any) {
    if (plugins) for (const p of plugins) p(opts, this);
    return this[opts.method](opts.path, opts.controller);
  };
  for (const extension of rest) Object.assign(app, extension);
  return app as any;
}
/**
 * conversion to ArrayBuffer ('cause transferring strings to uWS is really slow)
 */
export function toAB(data: Buffer | string): ArrayBuffer {
  var NodeBuf = data instanceof Buffer ? data : Buffer.from(data);
  return NodeBuf.buffer.slice(
    NodeBuf.byteOffset,
    NodeBuf.byteOffset + NodeBuf.byteLength
  ) as ArrayBuffer;
}

/**
 * Thanks to "acarstoiu" github user for listing such methods here: "https://github.com/uNetworking/uWebSockets.js/issues/1165".
 */
type WebSocketFragmentation = {
  /** Sends the first frame of a multi-frame message. More fragments are expected (possibly none), followed by a last fragment. Care must be taken so as not to interleave these fragments with whole messages (sent with WebSocket.send) or with other messages' fragments.
   *
   * Returns 1 for success, 2 for dropped due to backpressure limit, and 0 for built up backpressure that will drain over time. You can check backpressure before or after sending by calling getBufferedAmount().
   *
   * Make sure you properly understand the concept of backpressure. Check the backpressure example file.
   */
  sendFirstFragment(
    message: RecognizedString,
    isBinary?: boolean,
    compress?: boolean
  ): number;
  /** Sends a continuation frame of a multi-frame message. More fragments are expected (possibly none), followed by a last fragment. In terms of sending data, a call to this method must follow a call to WebSocket.sendFirstFragment.
   *
   * Returns 1 for success, 2 for dropped due to backpressure limit, and 0 for built up backpressure that will drain over time. You can check backpressure before or after sending by calling getBufferedAmount().
   *
   * Make sure you properly understand the concept of backpressure. Check the backpressure example file.
   */
  sendFragment(message: RecognizedString, compress?: boolean): number;
  /** Sends the last continuation frame of a multi-frame message. In terms of sending data, a call to this method must follow a call to WebSocket.sendFirstFragment or WebSocket.sendFragment.
   *
   * Returns 1 for success, 2 for dropped due to backpressure limit, and 0 for built up backpressure that will drain over time. You can check backpressure before or after sending by calling getBufferedAmount().
   *
   * Make sure you properly understand the concept of backpressure. Check the backpressure example file.
   */
  sendLastFragment(message: RecognizedString, compress?: boolean): number;
};
export interface DocumentedWS<UserData> extends WebSocket<UserData>, WebSocketFragmentation {
  /** 
   * this is an additional property, which saves you from server crashing. In "close" handler you should add "ws.closed = true" and each time you perform any asynchronous work before sending a message run a check "if(ws.closed) { cleanup and quit }"
   * @example 
   * import {setTimeout} from "node:timers/promises"
   * server.ws("/", {
   *    close(ws){
   *      ws.closed = true;
   *    },
   *    async message(ws){
   *      await setTimeout(100); // simulate some db query
   *      if(!ws.closed) ws.send("handled message", false)
   *    }
   * })
  * */
  closed: boolean;
  /**
  * an additional property which might save websocket from overexhaustion
  * */
  drainEvent: Promise<void> | undefined;
  /**
   * an additional property to monitor queued messages, which can't be sent due to overexhaustion (need to wait for drain).
   **/
  queue: number;

}
export interface DocumentedWSBehavior<UserData> {
  /** Maximum length of received message. If a client tries to send you a message larger than this, the connection is immediately closed. Defaults to 16 * 1024. */
  maxPayloadLength?: number;
  /** Whether or not we should automatically close the socket when a message is dropped due to backpressure. Defaults to false. */
  closeOnBackpressureLimit?: boolean;
  /** Maximum number of minutes a WebSocket may be connected before being closed by the server. 0 disables the feature. */
  maxLifetime?: number;
  /** Maximum amount of seconds that may pass without sending or getting a message. Connection is closed if this timeout passes. Resolution (granularity) for timeouts are typically 4 seconds, rounded to closest.
   * Disable by using 0. Defaults to 120.
   */
  idleTimeout?: number;
  /** What permessage-deflate compression to use. uWS.DISABLED, uWS.SHARED_COMPRESSOR or any of the uWS.DEDICATED_COMPRESSOR_xxxKB. Defaults to uWS.DISABLED. */
  compression?: CompressOptions;
  /** Maximum length of allowed backpressure per socket when publishing or sending messages. Slow receivers with too high backpressure will be skipped until they catch up or timeout. Defaults to 64 * 1024. */
  maxBackpressure?: number;
  /** Whether or not we should automatically send pings to uphold a stable connection given whatever idleTimeout. */
  sendPingsAutomatically?: boolean;
  /** Handler for new WebSocket connection. WebSocket is valid from open to close, no errors. */
  open?: (ws: DocumentedWS<UserData>) => void | Promise<void>;
  /** Handler for a WebSocket message. Messages are given as ArrayBuffer no matter if they are binary or not. Given ArrayBuffer is valid during the lifetime of this callback (until first await or return) and will be neutered. */
  message?: (
    ws: DocumentedWS<UserData>,
    message: ArrayBuffer,
    isBinary: boolean
  ) => void | Promise<void>;
  /** Handler for a dropped WebSocket message. Messages can be dropped due to specified backpressure settings. Messages are given as ArrayBuffer no matter if they are binary or not. Given ArrayBuffer is valid during the lifetime of this callback (until first await or return) and will be neutered. */
  dropped?: (
    ws: DocumentedWS<UserData>,
    message: ArrayBuffer,
    isBinary: boolean
  ) => void | Promise<void>;
  /** Handler for when WebSocket backpressure drains. Check ws.getBufferedAmount(). Use this to guide / drive your backpressure throttling. */
  drain?: (ws: DocumentedWS<UserData>) => void;
  /** Handler for close event, no matter if error, timeout or graceful close. You may not use WebSocket after this event. Do not send on this WebSocket from within here, it is closed. */
  close?: (
    ws: DocumentedWS<UserData>,
    code: number,
    message: ArrayBuffer
  ) => void;
  /** Handler for received ping control message. You do not need to handle this, pong messages are automatically sent as per the standard. */
  ping?: (ws: DocumentedWS<UserData>, message: ArrayBuffer) => void;
  /** Handler for received pong control message. */
  pong?: (ws: DocumentedWS<UserData>, message: ArrayBuffer) => void;
  /** Handler for subscription changes. */
  subscription?: (
    ws: DocumentedWS<UserData>,
    topic: ArrayBuffer,
    newCount: number,
    oldCount: number
  ) => void;
  /** Upgrade handler used to intercept HTTP upgrade requests and potentially upgrade to WebSocket.
   * See UpgradeAsync and UpgradeSync example files.
   */
  upgrade?: (
    res: HttpResponse<UserData>,
    req: HttpRequest,
    context: us_socket_context_t
  ) => void | Promise<void>;
}
export type DeclarativeResType = {
  writeHeader(key: string, value: string): DeclarativeResType;
  writeQueryValue(key: string): DeclarativeResType;
  writeHeaderValue(key: string): DeclarativeResType;
  /**
   * Write a chunk to the precompiled response
   */
  write(value: string): DeclarativeResType;
  writeParameterValue(key: string): DeclarativeResType;
  /**
   * Method to finalize forming a response.
   */
  end(value: string): any;
  writeBody(): DeclarativeResType;
  /**
   * additional method from µBlitz.js
   */
  writeHeaders<Opts extends BaseHeaders>(headers: Opts): DeclarativeResType;
};
/**
 * Almost nothing different from uWS.DeclarativeResponse. The only modification - writeHeaders method (several methods, typescript intellisense)
 */
export var DeclarativeResponse: {
  new (): DeclarativeResType;
} = (uWS as any).DeclarativeResponse;
export * from "./http-codes.js"
export * from "./http-headers.js"
