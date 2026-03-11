"use strict";
/**
* Yes, I have just deprecated the whole category. It will be completely removed in 2.0.0. When is it coming? Who knows
* */



import { toAB } from "./index.js";
import type { HttpResponse as uwsHttpResponse } from "uWebSockets.js";
import type { HttpRequest, HttpMethods } from "./index.ts";
/**
 * @deprecated
 * uWS actually checks content-length by itself
 */
export function checkContentLength(
  res: uwsHttpResponse,
  req: HttpRequest
): number {
  var header = req.getHeader("content-length");
  var CL: number;
  if (!header || !Number.isInteger(CL = Number(header))) {
    res.finished = true;
    res.cork(() => res.writeStatus("411").end("Content-Length is required to be > 0 and to be an integer"));
    throw new Error("Wrong content-length", { cause: { CL: header} });
  }
  return CL;
}
/**
 * @deprecated
 * This function throws, so it is slow. 
 */
export function badRequest(
  res: uwsHttpResponse,
  error: string,
  causeForYou: string
): void {
  res.finished = true;
  if (!res.aborted) res.cork(() => res.writeStatus("400").end(toAB(error)));
  throw new Error("Bad request", { cause: causeForYou });
}
/**
 * @deprecated
 * These are 2 lines of code. 
 */
export function tooLargeBody(res: uwsHttpResponse, limit: number): void {
  if (!res.aborted) res.cork(() => res.writeStatus("413").end("Body is too large. Limit in bytes - " + limit));
  res.finished = true;
}
/**
 * @deprecated
 * use "typedAllowHeader" instead
 */
export function seeOtherMethods(
  methodsArr: HttpMethods[]
): (res: uwsHttpResponse, req: any) => any {
  if(new Set(methodsArr).size != methodsArr.length) throw new Error("the methods repeat")
  var arr: string[] = []
  loop: for(var method of methodsArr){
    switch(method){
      case "ws": continue loop;
      case "del": arr.push("DELETE"); break;
      default: arr.push(method.toUpperCase())
    }
  }
  var methods = toAB(arr.join(", "));
  return (res) =>
    res.writeStatus("405").writeHeader("Allow", methods).end("Method is not allowed");
}
/**
 * @deprecated 
 * This is 1-2 lines of code
 */
export function notFoundConstructor(
  message: string = "Not found"
): (res: uwsHttpResponse, req: any) => any {
  var mes = toAB(message);
  return (res) => res.writeStatus("404").end(mes, true);
}
/**
 * @deprecated
 * code: required content length
 */
export var c411 = toAB("411");
/**
 * @deprecated
 * code: bad request
 */
export var c400 = toAB("400");
/**
 * @deprecated
 * code: payload too large
 */
export var c413 = toAB("413");
/**
 * @deprecated
 * code: method not allowed
 */
export var c405 = toAB("405");
/**
 * @deprecated
 * code: not found
 */
export var c404 = toAB("404");
