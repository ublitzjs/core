"use strict";
import { toAB } from "./index.mjs";
export var c411 = toAB("411");
export var c400 = toAB("400");
export var c413 = toAB("413");
export var c405 = toAB("405");
export var c404 = toAB("404");
var c405Message = toAB("Method is not allowed");
var allowHeader = toAB("Allow");
var checkHeader = toAB("content-length");
var checkMessage = toAB("Content-Length required to be > 0");
function checkContentLength(res, req) {
  var CL = Number(req.getHeader(checkHeader));
  if (!CL) {
    res.finished = true;
    res.cork(() => res.writeStatus(c411).end(checkMessage));
    throw new Error("Wrong content-length", { cause: { CL } });
  }
  return CL;
}
function badRequest(res, error, causeForYou) {
  res.finished = true;
  if (!res.aborted) res.cork(() => res.writeStatus(c400).end(toAB(error)));
  throw new Error("Bad request", { cause: causeForYou });
}
function tooLargeBody(res, limit) {
  var message = toAB("Body is too large. Limit in bytes - " + limit);
  if (!res.aborted) res.cork(() => res.writeStatus(c413).end(message));
  res.finished = true;
}
function seeOtherMethods(methodsArr) {
  var methods = toAB(
    methodsArr
      .map((method) => method.toUpperCase())
      .join(", ")
      .replace("DEL", "DELETE")
      .replace(/ WS,*/g, "")
  );
  return (res) =>
    res.writeStatus(c405).writeHeader(allowHeader, methods).end(c405Message);
}
function notFoundConstructor(message = "Not found") {
  var mes = toAB(message);
  return (res) => res.writeStatus(c404).end(mes, true);
}
export {
  badRequest,
  checkContentLength,
  notFoundConstructor,
  seeOtherMethods,
  tooLargeBody,
};
