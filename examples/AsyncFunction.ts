/**
 * The example below refers to abort handling with async functions. For scalability still use Router and extendApp.
 */
import { setTimeout, clearTimeout } from "node:timers";
import uWS from "uWebSockets.js";

import { registerAbort, HeadersMap, type HttpResponse } from "@ublitzjs/core";
const port = 9001;
const stopAllEvent = Symbol();
const setHeaders = new HeadersMap({
  ...HeadersMap.baseObj,
  "Content-Type": "application/json",
}).prepare();

type PromiseWorked = "NO" | "OK";
type Task = Promise<PromiseWorked>;

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

function createRandomlyDelayedTask(res: uWS.HttpResponse): Task {
  const delay = Math.random() * 1000 + 200;
  return createPromisedTask(res as any, delay);
}

function generateRandomlyDelayedTasks(res: uWS.HttpResponse): Task[] {
  const randomArray = new Array();
  var i = 0;
  var max = Math.round(Math.random() * 10);
  do {
    randomArray[i] = createRandomlyDelayedTask(res);
  } while (++i < max);
  return randomArray;
}

async function handler(res: HttpResponse) {
  /* register abort handler, which adds an event extensible event emitter for abort and "res.aborted" flag */
  registerAbort(res);

  /*get all async random tasks (imagine here a fetch call or db query)*/
  var tasks = generateRandomlyDelayedTasks(res);

  /*These tasks are protected*/
  const onAborted = () => {
    res.emitter.emit(stopAllEvent);
  };
  res.emitter.once("abort", onAborted);
  var resultsArray = await Promise.all(tasks);

  /*clean up*/
  res.emitter.removeListener("abort", onAborted);

  /*count successes and failures*/
  var counts: Record<PromiseWorked, number> = { OK: 0, NO: 0 };
  resultsArray.forEach((v) => counts[v]++);
  const resultsString = JSON.stringify(counts);
  /* If we were aborted, you cannot respond */
  if (res.aborted) return;
  setHeaders(res);
  res.cork(() => {
    res.end(resultsString);
  });
}
uWS
  .App()
  .get("/*", handler as any)
  .listen(port, (token) => {
    if (token) console.info("Listening to port " + port);
    else console.error("Failed to listen to port " + port);
  });
