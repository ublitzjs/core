import type { HttpResponse as uwsHttpResponse } from "uWebSockets.js";
import type { HttpRequest, HttpMethods } from "./index.ts";
/**
 * If something wrong is to content-length, sends 411 code and throws error with a "cause" == { CL : string}, sets res.finished = true
 */
export declare function checkContentLength(res: uwsHttpResponse, req: HttpRequest): number;
/**
 * sends http 400 and throws an Error with "causeForYou", sets res.finished = true
 */
export declare function badRequest(res: uwsHttpResponse, error: string, causeForYou: string): void;
/**
 * sends http 413, but doesn't throw an Error, sets res.finished = true
 */
export declare function tooLargeBody(res: uwsHttpResponse, limit: number): void;
/**
 * Constructs function, which sends http 405 and sets http Allow header with all methods you passed.
 * It ignores "ws" and replaces "del" on "DELETE"
 */
export declare function seeOtherMethods(methodsArr: HttpMethods[]): (res: uwsHttpResponse, req: any) => any;
/**
 * Constructs the function, which sets 404 http code and sends the message you have specified
 */
export declare function notFoundConstructor(message?: string): (res: uwsHttpResponse, req: any) => any;
/**
 * code: required content length
 */
export declare var c411: ArrayBuffer;
/**
 * code: bad request
 */
export declare var c400: ArrayBuffer;
/**
 * code: payload too large
 */
export declare var c413: ArrayBuffer;
/**
 * code: method not allowed
 */
export declare var c405: ArrayBuffer;
/**
 * code: not found
 */
export declare var c404: ArrayBuffer;
