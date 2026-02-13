"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.badRequest = badRequest;
exports.c413 = exports.c411 = exports.c405 = exports.c404 = exports.c400 = void 0;
exports.checkContentLength = checkContentLength;
exports.notFoundConstructor = notFoundConstructor;
exports.seeOtherMethods = seeOtherMethods;
exports.tooLargeBody = tooLargeBody;
var _index = require("./index.js");
var c405Message = (0, _index.toAB)("Method is not allowed");
var allowHeader = (0, _index.toAB)("Allow");
var checkHeader = (0, _index.toAB)("content-length");
var checkMessage = (0, _index.toAB)("Content-Length is required to be > 0 and to be an integer");
/**
 * If something wrong is to content-length, sends 411 code and throws error with a "cause" == { CL : string}, sets res.finished = true
 */
function checkContentLength(res, req) {
  var header = req.getHeader(checkHeader);
  var CL;
  if (!header || !Number.isInteger(CL = Number(header))) {
    res.finished = true;
    res.cork(() => res.writeStatus(c411).end(checkMessage));
    throw new Error("Wrong content-length", {
      cause: {
        CL: header
      }
    });
  }
  return CL;
}
/**
 * sends http 400 and throws an Error with "causeForYou", sets res.finished = true
 */
function badRequest(res, error, causeForYou) {
  res.finished = true;
  if (!res.aborted) res.cork(() => res.writeStatus(c400).end((0, _index.toAB)(error)));
  throw new Error("Bad request", {
    cause: causeForYou
  });
}
/**
 * sends http 413, but doesn't throw an Error, sets res.finished = true
 */
function tooLargeBody(res, limit) {
  var message = (0, _index.toAB)("Body is too large. Limit in bytes - " + limit);
  if (!res.aborted) res.cork(() => res.writeStatus(c413).end(message));
  res.finished = true;
}
/**
 * Constructs function, which sends http 405 and sets http Allow header with all methods you passed.
 * It ignores "ws" and replaces "del" on "DELETE"
 */
function seeOtherMethods(methodsArr) {
  if (new Set(methodsArr).size != methodsArr.length) throw new Error("the methods repeat");
  var arr = [];
  loop: for (var method of methodsArr) {
    switch (method) {
      case "ws":
        continue loop;
      case "del":
        arr.push("DELETE");
        break;
      default:
        arr.push(method.toUpperCase());
    }
  }
  var methods = (0, _index.toAB)(arr.join(", "));
  return res => res.writeStatus(c405).writeHeader(allowHeader, methods).end(c405Message);
}
/**
 * Constructs the function, which sets 404 http code and sends the message you have specified
 */
function notFoundConstructor(message = "Not found") {
  var mes = (0, _index.toAB)(message);
  return res => res.writeStatus(c404).end(mes, true);
}
/**
 * code: required content length
 */
var c411 = exports.c411 = (0, _index.toAB)("411");
/**
 * code: bad request
 */
var c400 = exports.c400 = (0, _index.toAB)("400");
/**
 * code: payload too large
 */
var c413 = exports.c413 = (0, _index.toAB)("413");
/**
 * code: method not allowed
 */
var c405 = exports.c405 = (0, _index.toAB)("405");
/**
 * code: not found
 */
var c404 = exports.c404 = (0, _index.toAB)("404");