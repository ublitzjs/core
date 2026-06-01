import { describe, it, expect, test, afterAll } from "vitest"
import WebSocket from "ws"
import {
  App,
  us_listen_socket_close,
  type us_listen_socket,
  us_socket_local_port
} from "uwsjs-fork"
import { expectError, expectType } from "tsd"
import type {
  onlyHttpMethods,
  routeFNOpts,
  HttpResponse,
} from "@ublitzjs/core"
import {
  type lowHeadersT
} from "@ublitzjs/headers"
var runningTsd: boolean = false;

export async function testIndex(module: typeof import('@ublitzjs/core')) {
  var server = module.extendApp(App<HttpResponse>(), { a: 10 } as const, { b: "b" } as const);
  var port: number;
  var socket: us_listen_socket;
  var basicResponse = "hello";
  function genUrl(url: string) {
    return "http://localhost:" + port + url;
  }
  describe("basic functionality of extendApp", () => {
    it("extends", () => {
      // here typescript compiler won't let untyped data stay invisible
      expect(server.get.apply).toBeDefined()
      expect(server.a).toBe(10);
      expect(server.b).toBe("b")
      if (runningTsd) {
        expectType<10>(server.a)
        expectType<"b">(server.b)
      }
    })
    it("enables 'register' and 'onError'", () => {
      var didRun: boolean = false;
      server.register((serverAgain) => {
        didRun = true;
        expect(server).toBe(serverAgain);
        if (runningTsd) {
          expectType<typeof server>(serverAgain)
        }
      })
      expect(didRun).toBe(true);
      function onError() { } //just to be
      server.onError(onError)
      expect(server._errHandler).toBe(onError)
    })
    it("has mechanism for server preparation", async () => {
      var first = false;
      var second = false;
      server.awaitLater(Promise.resolve().then(() => { first = true }), Promise.resolve().then(() => { second = true; }))
      expect(server._startPromises.length).toBe(2)
      expect([first, second]).toEqual([false, false])
      await server.ready();
      expect([first, second]).toEqual([true, true])
      expect(server._startPromises.length).toBe(0)
    })
    it("has special 'route' (just its assignment)", () => {
      type compileTimeOptions = { deprecated: boolean }
      var lastDeprecatedMethod: onlyHttpMethods | undefined;
      function markDeprecation(opts: routeFNOpts<onlyHttpMethods> & compileTimeOptions) {
        if (opts.deprecated) lastDeprecatedMethod = opts.method
      }
      server.route<onlyHttpMethods, compileTimeOptions>({
        method: "get",
        path: "/route",
        controller(res) { res.end(basicResponse) },
        deprecated: true
      }, [markDeprecation])
      if (runningTsd) {
        expectError(
          server.route<"abcd">({
            controller() { },
            method: "abcd",
            path: "/"
          })
        )
        expectError(
          server.route<onlyHttpMethods, compileTimeOptions>({
            controller() { }, method: "get", path: "/"
          })
        )
      }
      expect(lastDeprecatedMethod).toBe("get")
    })
  })
  test("closure is a closure indeed", () => {
    var result = module.closure(() => {
      var x = { "a": 10 } as const;
      return x;
    })
    expect(result["a"]).toBe(10)
    if (runningTsd) {
      expectType<{ readonly "a": 10 }>(result)
    }
  })
  await new Promise<void>((resolve, reject) => {
    server.listen("localhost", 0, (listenSocket) => {
      port = us_socket_local_port(listenSocket);
      socket = listenSocket;
      if (!socket) reject();
      resolve();
    })
  })
  afterAll(() => { us_listen_socket_close(socket) })
  test("'route' method from extendApp actually works", async () => {
    expect(await fetch(genUrl("/route")).then(res => res.text())).toBe(basicResponse)
  })
  test("regAbort", () => {
    var control = new AbortController();
    return new Promise<void>((resolve) => {
      server.get("/abort", (res) => {
        module.regAbort(res)
        res.abortCh.sub(() => {
          expect(res.aborted).toBe(true)
          resolve();
        })
        expect(res.aborted).toBe(false)
        control.abort();
      })
      fetch(genUrl("/abort"), { signal: control.signal }).catch(() => false)
    })

  })
  test("websockets", async () => {
    var client: WebSocket

    type WSData = { url: string }
    if (runningTsd) {
      server.ws<WSData>("/ws", {
        upgrade(res: HttpResponse<WSData>, req, context) {
          res.upgrade(
            { url: req.getUrl() },
            req.getHeader</*adds typescript support*/ lowHeadersT>(
              "sec-websocket-key"
            ),
            req.getHeader<lowHeadersT>("sec-websocket-protocol"),
            req.getHeader<lowHeadersT>("sec-websocket-extensions"),
            context
          );
          if (runningTsd) {
            //websocket data is typed (but now as good as could be due to compatibility with uWS.HttpResponse
            expectType<HttpResponse<{ url: string }>>(res);
          }
        },
        open() { },
        close() { },
      })
      client = new WebSocket("ws://localhost:" + port + "/ws", {});
      client.on("message", function(data) {
        expect(data.toString()).toBe("hello1\n hello2\n end hello")
        client.send("hello")
      })
    }
  })
}

