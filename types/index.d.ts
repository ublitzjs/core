import type {
  HttpRequest as uwsHttpRequest,
  TemplatedApp,
  HttpResponse as uwsHttpResponse,
  RecognizedString,
  us_socket_context_t,
} from "uWebSockets.js";
import { Buffer } from "node:buffer";

import { EventEmitter } from "tseep";
import type { DocumentedWSBehavior } from "./uws-types";
/**
 * function to effortlessly mark response as aborted AND to attach an event emitter, so that you can easily scale the handler. If you don't need event emitter and only some res.aborted - set it by yourself (no overkill for the handler)
 * @param res
 */
export function registerAbort(res: uwsHttpResponse): HttpResponse;
/**
 * An extended version of uWS.App . It provides you with several features:
 * 1) plugin registration (just like in Fastify);
 * 2) "ready" function and _startPromises array (use it to make your code more asynchronous and safe)
 * 3) "route" function for more descriptive adn extensible way of registering handlers
 * 4) "onError" function (mainly used by @ublitzjs/router)
 */
export interface Server extends TemplatedApp {
  /**
   * It is same as plugins in Fastify -> you register some routes in remove file
   * @param plugin
   * @returns itself for chaining methods
   */
  register(plugin: (server: this) => void): this;
  /** set global _errHandler (in fact it is used only by @ublitzjs/router) */
  onError(fn: (error: Error, res: HttpResponse, data: any) => any): this;
  _errHandler?(error: Error, res: HttpResponse, data: any): any;
  /**some undocumented property in uWS - get it here */
  addChildAppDescriptor(...any: any[]): this;
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
export var closure: <T>(param: () => T) => T;
/**
 * little more typed response which has:
 * 1) "emitter", that comes from "tseep" package
 * 2) "aborted" flag
 * 3) "finished" flag
 * 4) "collect" function, which comes from original uWS (and isn't documented), but the purpose remains unknown
 */
export interface HttpResponse<UserDataForWS extends object = {}>
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
  finished: boolean;
}
/**This HttpRequest is same as original uWS.HttpRequest, but getHeader method is typed for additional tips
 * @example
 * import {lowHeaders} from "ublitzjs"
 * // some handler later
 * req.getHeader<lowHeaders>("content-type")
 */
export interface HttpRequest extends uwsHttpRequest {
  getHeader<T extends RecognizedString = RecognizedString>(a: T): string;
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
): Server & MergeObjects<T>;
/**
 * conversion to ArrayBuffer ('cause transferring strings to uWS is really slow)
 */
export function toAB(data: Buffer | string): ArrayBuffer;

export * from "./http-headers";
export * from "./http-codes";
export * from "./uws-types";
