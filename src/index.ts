"use strict";
import type {RequiredBaseHeadersT} from "@ublitzjs/headers"

import { Channel } from "@ublitzjs/channel"
import type {
  HttpRequest,
  TemplatedApp,
  HttpResponse as uwsHttpResponse,
  RecognizedString,
  WebSocketBehavior
} from "uwsjs-fork"

/**
* Simple utility proving fast (at least 6+ times) tools to handle "onAborted" using "pub/sub" pattern. Inside uses custom "event emitter", but for one single event. Properties created are "res.aborted (boolean, becomes "true" when res.onAborted fires)" and "res.abortCh (abort channel, imported from ublitzjs/channel). However all callbacks you pass to "abortCh.sub" get "id" property. Don't touch it, ok? It assists with O(1) removal.
* @example
* server.get('/', (res)=>{
*   res.aborted === undefined // true
*   res.abortCh === undefined // true
*   regAbort(res); // no unwanted overhead
*   res.aborted === false;
*   function onAb() { console.log("aborted"); }
*   res.abortCh.sub(onAb);
*   setTimeout(()=>{
*     if(!res.aborted) { // you need to check, otherwise uWS drops server
*       res.abortCh.unsub(onAb); // O(1) lookup
*       res.end("HOORAY")
*     }
*   }, 1000)
* })
* */
export function regAbort(res: uwsHttpResponse): HttpResponse {
  if ("aborted" in res) throw new Error("abort already registered");
  res.aborted = false;
  res.abortCh = new Channel<undefined>()
  return res.onAborted(() => {
    res.aborted = true;
    res.abortCh.pub(undefined);
    res.abortCh.clear()
  }) as HttpResponse;
}
/**
 * An extended version of uWS.App . It provides you with several features:
 * 1) plugin registration (just like in Fastify);
 * 2) "ready" function and _startPromises array (use it to make your code more asynchronous and safe)
 * 3) "route" function for more descriptive adn extensible way of registering handlers
 * 4) "onError" function (mainly used by @ublitzjs/router)
 */
export interface Server<CustomResponse extends HttpResponse = HttpResponse> extends TemplatedApp<CustomResponse> {
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
}
export type routeFNOpts<T extends HttpMethods> = {
  method: T;
  path: RecognizedString;
  controller: T extends "ws" ? WebSocketBehavior<any> : HttpControllerFn;
};

/**
 * Utility for making closures. Exists for organizing code and caching values in non-global scope.
 * @param param
 * @returns what you passed
 */
export var closure = <T>(param: () => T): T => param() ;
/**
 * little more typed response which has:
 * 1) "aborted" flag
 * 2) "finished" flag
 * 3) auto-suggesting HttpResponse.writeHeader with ublitzjs/headers
 */
export interface HttpResponse<UserDataForWS = {}> extends uwsHttpResponse<UserDataForWS> {
  /**
  * An event channel for onAborted. You can subscribe to it and unsubscribe. "pub/clear" are better to be avoided here
  * server.get('/', (res)=>{
  *   res.aborted === undefined // true
  *   res.abortCh === undefined // true
  *   regAbort(res); // no unwanted overhead
  *   res.aborted === false;
  *   function onAb() { console.log("aborted"); }
  *   res.abortCh.sub(onAb);
  *   setTimeout(()=>{
  *     if(!res.aborted) { // you need to check, otherwise uWS drops server
  *       res.abortCh.unsub(onAb); // O(1) lookup
  *       res.end("HOORAY")
  *     }
  *   }, 1000)
  * })
  * */
  abortCh: Channel<void>
  /**
   * changes when res.onAborted fires (you have to use regAbort (not registerAbort) for this)
   */
  aborted: boolean;
  /**
   * You should set it manually when ending the response. Particularly useful if some error has fired and you are doubting whether res.aborted is a sufficient flag.
   * @example
   * function endResponse(res) {
   *   if(res.aborted) return;
   *   res.end("alright")
   *   res.finished = true;
   * }
   */
  finished?: boolean;
  /**
  * Writes key and value to HTTP response. See writeStatus and corking.
  * It can actually write several values in a row, just be careful with string concatenation. If headers never change - use staticHeaders (and save typescript safety)
  * @example
  * res.writeHeader("Content-Type", "text/plain").writeHeader("Accept-Ranges", "bytes")
  * // and a faster trick
  * res.writeHeader("Content-Type: text/plain\r\nAccept-Ranges", "bytes")
  * */
  writeHeader<Key extends keyof RequiredBaseHeadersT | Omit<RecognizedString, string> | (string & {})>(key: Key, val: Key extends keyof RequiredBaseHeadersT ? RequiredBaseHeadersT[Key] : RecognizedString): this;
}
/**This HttpRequest is same as original uWS.HttpRequest, but getHeader method is typed for additional tips
 * @example
 * import {lowHeaders} from "@ublitzjs/core"
 * // some handler later (not compulsory to specify lowHeaders. It is a default behaviour)
 * req.getHeader<lowHeaders>("content-type")
 *
 */

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
export function extendApp<T extends object[], CustomResponse extends HttpResponse = HttpResponse>(
  app: TemplatedApp<CustomResponse>,
  ...rest: T
): Server<CustomResponse> & MergeObjects<T> {
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
