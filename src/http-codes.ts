"use strict";
import { toAB } from "./index.js";
var c405Message = toAB("Method is not allowed");
var allowHeader = toAB("Allow");
var checkHeader = toAB("content-length");
var checkMessage = toAB("Content-Length is required to be > 0 and to be an integer");
import type { HttpResponse as uwsHttpResponse } from "uWebSockets.js";
import type { HttpRequest, HttpMethods } from "./index.ts";
/**
 * If something wrong is to content-length, sends 411 code and throws error with a "cause" == { CL : string}, sets res.finished = true
 */
export function checkContentLength(
  res: uwsHttpResponse,
  req: HttpRequest
): number {
  var header = req.getHeader(checkHeader);
  var CL: number;
  if (!header || !Number.isInteger(CL = Number(header))) {
    res.finished = true;
    res.cork(() => res.writeStatus(c411).end(checkMessage));
    throw new Error("Wrong content-length", { cause: { CL: header} });
  }
  return CL;
}
/**
 * sends http 400 and throws an Error with "causeForYou", sets res.finished = true
 */
export function badRequest(
  res: uwsHttpResponse,
  error: string,
  causeForYou: string
): void {
  res.finished = true;
  if (!res.aborted) res.cork(() => res.writeStatus(c400).end(toAB(error)));
  throw new Error("Bad request", { cause: causeForYou });
}
/**
 * sends http 413, but doesn't throw an Error, sets res.finished = true
 */
export function tooLargeBody(res: uwsHttpResponse, limit: number): void {
  var message = toAB("Body is too large. Limit in bytes - " + limit);
  if (!res.aborted) res.cork(() => res.writeStatus(c413).end(message));
  res.finished = true;
}
/**
 * Constructs function, which sends http 405 and sets http Allow header with all methods you passed.
 * It ignores "ws" and replaces "del" on "DELETE"
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
    res.writeStatus(c405).writeHeader(allowHeader, methods).end(c405Message);
}

/**
 * Constructs the function, which sets 404 http code and sends the message you have specified
 */
export function notFoundConstructor(
  message: string = "Not found"
): (res: uwsHttpResponse, req: any) => any {
  var mes = toAB(message);
  return (res) => res.writeStatus(c404).end(mes, true);
}
/**
 * code: required content length
 */
export var c411 = toAB("411");
/**
 * code: bad request
 */
export var c400 = toAB("400");
/**
 * code: payload too large
 */
export var c413 = toAB("413");
/**
 * code: method not allowed
 */
export var c405 = toAB("405");
/**
 * code: not found
 */
export var c404 = toAB("404");
