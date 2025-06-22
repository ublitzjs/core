"use strict";
import { WebSocket } from "ws";
import { afterAll, beforeAll, expect, test } from "vitest";
import type { DocumentedWSBehavior, lowHeaders } from "../types/index.d.ts";
import uWS, {
  us_listen_socket_close,
  us_socket_local_port,
  type us_listen_socket,
} from "uWebSockets.js";
var socket: us_listen_socket;
const server = uWS.App();
var port: number;
server.ws("/*", {
  upgrade(res, req, context) {
    res.upgrade(
      { url: req.getUrl() },
      req.getHeader</*adds typescript support*/ lowHeaders>(
        "sec-websocket-key"
      ),
      req.getHeader<lowHeaders>("sec-websocket-protocol"),
      req.getHeader<lowHeaders>("sec-websocket-extensions"),
      context
    );
  },
  async open(ws) {
    ws.sendFirstFragment("hello1\n ");
    ws.sendFragment("hello2\n ");
    ws.sendLastFragment("end hello");
  },
} as DocumentedWSBehavior<{}> as any);

beforeAll(() => {
  return new Promise<void>((resolve) => {
    server.listen(0, (token) => {
      socket = token;
      port = us_socket_local_port(token);
      console.log("PORT", port);
      resolve();
    });
  });
});
afterAll(() => {
  us_listen_socket_close(socket);
});
test("WebSocket streaming", () => {
  const websocket = new WebSocket(`ws://localhost:${port}`);
  return new Promise<void>((resolve) => {
    websocket.onmessage = function (event) {
      expect(event.data).toBe("hello1\n hello2\n end hello");
      websocket.close();
      resolve();
    };
  });
});
