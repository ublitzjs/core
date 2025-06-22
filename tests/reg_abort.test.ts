"use strict";
import { afterAll, beforeAll, expect, test } from "vitest";
import { setTimeout, promises as time } from "node:timers";
import uWS, {
  us_listen_socket_close,
  us_socket_local_port,
  type us_listen_socket,
} from "uWebSockets.js";
import type { HttpResponse } from "../types/index";
import { registerAbort } from "../mjs/index.mjs";
import { request } from "undici";
var socket: us_listen_socket;
type PromiseWorked = "NO" | "OK";
type Task = Promise<PromiseWorked>;
var reqResult: PromiseWorked[];
var port: number;
const stopAllEvent = Symbol();
function createPromisedTask(res: HttpResponse, delay: number): Task {
  return new Promise<PromiseWorked>((resolve) => {
    const timeout = setTimeout(() => {
      res.emitter
        .removeListener("abort", onAborted)
        .removeListener(stopAllEvent, onAborted);
      resolve("OK");
    }, delay);
    function onAborted() {
      clearTimeout(timeout);
      /*still resolve, because all timeout need to be stopped */
      resolve("NO");
    }
    res.emitter.once("abort", onAborted).once(stopAllEvent, onAborted);
  });
}
const server = uWS.App().get("/", async (res) => {
  registerAbort(res);
  var tasks = [
    createPromisedTask(res as any, 100),
    createPromisedTask(res as any, 400),
  ];
  const onAborted = () => {
    res.emitter.emit(stopAllEvent);
  };

  res.emitter.once("abort", onAborted);
  reqResult = await Promise.all(tasks);
  res.emitter.removeListener("abort", onAborted);
  if (!res.aborted) res.close();
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
test('light "asyncFunction" works', async () => {
  var ctrl = new AbortController();
  request(`http://localhost:${port}/`, { signal: ctrl.signal }).catch(() => {});
  await time.setTimeout(250);
  ctrl.abort();
  await time.setTimeout(500); // wait till request ends
  us_listen_socket_close(socket);
  expect(reqResult).toEqual(["OK", "NO"]);
});
