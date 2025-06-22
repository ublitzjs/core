import type { HttpResponse as uwsHttpResponse } from "uWebSockets.js";
import type { HttpRequest, HttpMethods } from ".";
/**
 * If something wrong is to content-length, sends 411 code and throws error with a "cause"
 */
export function checkContentLength(
  res: uwsHttpResponse,
  req: HttpRequest
): number;
/**
 * sends http 400 and throws an Error with "causeForYou"
 */
export function badRequest(
  res: uwsHttpResponse,
  error: string,
  causeForYou: string
): void;
/**
 * sends http 413 And throws, but doesn't throw an Error
 */
export function tooLargeBody(res: uwsHttpResponse, limit: number): void;
/**
 * Constructs function, which sends http 405 and sets http Allow header with all methods you passed
 */
export function seeOtherMethods(
  methodsArr: HttpMethods[]
): (res: uwsHttpResponse, req: any) => any;

/**
 * Constructs the function, which sets 404 http code and sends the message you have specified
 */
export function notFoundConstructor(
  message?: string
): (res: uwsHttpResponse, req: any) => any;
/**
 * code: required content length
 */
export var c411: ArrayBuffer;
/**
 * code: bad request
 */
export var c400: ArrayBuffer;
/**
 * code: payload too large
 */
export var c413: ArrayBuffer;
/**
 * code: method not allowed
 */
export var c405: ArrayBuffer;
/**
 * code: not found
 */
export var c404: ArrayBuffer;
