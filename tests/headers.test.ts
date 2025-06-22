"use strict";
import { afterAll, beforeAll, expect, test } from "vitest";
import uWS, {
  us_listen_socket_close,
  us_socket_local_port,
  type us_socket,
} from "uWebSockets.js";
import { HeadersMap, setCSP, toAB } from "../mjs/index.mjs";
import { request } from "undici";
var socket: us_socket;
var port: number;
const htmlHeaders = new HeadersMap({
  "Content-Type": "text/html",
  "Content-Security-Policy": setCSP({
    "connect-src": ["'self'"],
    "base-uri": ["'none'"],
  }),
});
const setHeaders = htmlHeaders.prepare();
const server = uWS.App();
const html = toAB("<h1>Hello</h1>");
server.get("/", (res) => {
  setHeaders(res).end(html);
});
beforeAll(() => {
  return new Promise<void>((resolve) => {
    server.listen(0, (token) => {
      socket = token;
      port = us_socket_local_port(token);
      resolve();
    });
  });
});
afterAll(() => {
  us_listen_socket_close(socket);
});
test("HeadersMap and setCSP work", async () => {
  var response = await request(`http://localhost:${port}/`);
  var headers = response.headers;
  expect(headers["content-type"]).toBe("text/html");
  expect(headers["content-security-policy"]).toBe(
    "connect-src 'self'; base-uri 'none'; "
  );
});
