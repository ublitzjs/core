import { describe, it, expect, test, afterAll } from "vitest"
import testParseRange from "./parseRange"
import WebSocket from "ws"
import {
  App,
  us_listen_socket_close,
  type HttpResponse as uwsHttpResponse,
  type us_listen_socket,
  us_socket_local_port
} from "uWebSockets.js"
import { expectError, expectType } from "tsd"
import {
  type onlyHttpMethods,
  type routeFNOpts,
  type HttpResponse,
  type lowHeaders,
  toAB
} from "@ublitzjs/core"
var runningTsd: boolean = false;

export async function testIndex(module: typeof import('@ublitzjs/core')) {
  var server = module.extendApp(App(), { a: 10 } as const, { b: "b" } as const);
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
  test("Content-Security-Policy generator", () => {
    var result = module.setCSP({ "connect-src": ["'self'"], "style-src": ["'self'"] })
    expect(result).toBe("connect-src 'self'; style-src 'self'; ")

    expect(module.CSPDirs["connect-src"]).toEqual(["'self'"])
    result = module.setCSP(module.CSPDirs, "connect-src")
    expect([result.search("style-src") != -1, result.search("connect-src") == -1]).toEqual([true, true])
  })
  test("deprecated to arrayBuffer", () => {
    expect(new TextDecoder().decode(module.toAB(basicResponse))).toBe(basicResponse)
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
  test("extended DeclarativeResponse", async () => {
    server.get(
      "/declarative",
      new module.DeclarativeResponse()
        .writeHeaders({ "Content-Type": "text/plain", "Allow": "Get" })
        .end(basicResponse)
    )
    var response = await fetch(genUrl("/declarative"));
    expect(response.headers.get("Content-Type")).toBe("text/plain")
    expect(response.headers.get("Allow")).toBe("Get")
    expect(await response.text()).toBe(basicResponse)
  })
  describe("advanced headers", () => {
    it("deprecated HeadersMap", async () => {
      var writeHeaders = module.HeadersMap.default
      server.get("/headers/default", (res) => {
        writeHeaders(res).end("hello")
      })
      async function check() {
        var response = await fetch(genUrl("/headers/default"))
        expect(response.headers.get("x-download-options")).toBe("noopen")
      }
      var headers = new module.HeadersMap(module.HeadersMap.baseObj)
      writeHeaders = headers.toRes.bind(headers);
      await check();
      writeHeaders = headers.prepare();
      expect(headers.currentHeaders).toBeUndefined()
      await check();
      // it is typed for uWS and uBlitz.js equally
      if (runningTsd) {
        var a: any;
        expectType<uwsHttpResponse>(writeHeaders(a as uwsHttpResponse))
        expectType<HttpResponse<{}>>(writeHeaders(a as HttpResponse))
        type userRes = HttpResponse<{ id: number }> & { userKey: string }
        expectType<userRes>(writeHeaders(a as userRes))
        // but it accepts only response object
        expectError(writeHeaders(a as number))
      }
    })
    it("typed headers of request and response objects", () => {
      server.any("/headers", (res, req) => {
        expectError(req.getHeader<"content-type">("not content type"))
        expectError(res.writeHeader("Content-Type", ""))
        //ok
        res.writeHeader("Content-Type", "application/json")
        // allows custom headers
        res.writeHeader("own header", "own data")
        var header = toAB("ab")
        var val = toAB("val")
        // can work with default uWS types
        res.writeHeader(header, val)
      })
    })
    it("CRLF manipulations (I DIDN'T LIE)", async () => {
      server.get("/CRLF", (res) => {
        // left-side crlf works
        res.writeHeader("one: 1\r\ntwo: 2\r\nthree", "3")
        // right-side crlf works
        res.writeHeader("four", "4\r\nfive: 5").end("ok")
      })
      var result = await fetch(genUrl("/CRLF"))
      var headers = Object.fromEntries(result.headers.entries())
      delete headers.date
      delete headers.uwebsockets
      expect(headers).toEqual({
        one: "1", two: "2", three: "3", four: "4", five: "5", "content-length": "2"
      })
    })
    describe("staticHeaders", () => {
      it("returns type of the last param", () => {
        expectType<"Accept-Ranges">(module.staticHeaders({}, "Accept-Ranges"))
      })
      it("has validation inside first param", () => {
        expectError(module.staticHeaders({ "Content-Type": "application:json" }, "Accept-Ranges"))
      })
      it("accepts own headers inside first param", () => {
        expectType<"ABCD">(module.staticHeaders({ "own": "own" }, "ABCD"))
      })
      it("works", () => {
        expect(
          module.staticHeaders({
            "Content-Type": "text/plain", "Content-Range": "bytes 0-999/1000"
          }, "Accept-Ranges")
        ).toBe(
          "Content-Type: text/plain\r\nContent-Range: bytes 0-999/1000\r\nAccept-Ranges"
        )
      })
    })
    test("typedAllowHeader", () => {
      var header = module.typedAllowHeader(["ws", "del", "get", "post"])
      expect(header).toBe("DELETE, GET, POST")
    })
  })
  describe("deprecated route helpers", () => {
    it("seeOtherMethods", async () => {
      server.any("/seeOther", module.seeOtherMethods(["ws", "del", "get", "post"]))
      var result = await fetch(genUrl("/seeOther"))
      var header = result.headers.get("Allow")
      expect(header).toBe("DELETE, GET, POST")
    })
    it("notFoundConstructor", async () => {
      var response = "NOT FOUND!!!"
      server.any("/no", module.notFoundConstructor(response))
      var result = await fetch(genUrl("/no"))
      expect(result.status).toBe(404)
      expect(await result.text()).toBe(response)
    })
    it("badRequest", async () => {
      server.get("/bad", (res) => {
        try {
          module.badRequest(res, "it is an error", "JUST BECAUSE");
        } catch (err) {
          expect((err as Error).cause).toBe("JUST BECAUSE")
        }
      })
      var result = await fetch(genUrl("/bad"))
      expect(result.status).toBe(400)
      expect(await result.text()).toBe("it is an error")
    })
    it("tooLargeBody", async () => {
      server.get("/bad", (res) => {
        module.tooLargeBody(res, 10);
      })
      var result = await fetch(genUrl("/bad"))
      expect(result.status).toBe(413)
      expect(await result.text()).toBe("Body is too large. Limit in bytes - 10")
    })
    it("checkContentLength", async () => {
      server.post("/cl", (res, req) => {
        var CL: number;
        try {
          CL = module.checkContentLength(res, req);
        } catch (err) { console.log(err) }
        expect(CL!).toBe(1)
        res.endWithoutBody();
      })
      var result = await fetch(genUrl("/cl"), { method: "post", body: "a" })
      expect(result.status).toBe(200)
    })
  })
  test("deprecated registerAbort", () => {
    var control = new AbortController();
    return new Promise<void>((resolve) => {
      server.get("/abort/deprecated", (res) => {
        module.registerAbort(res)
        res.emitter.once("abort", () => {
          expect(res.aborted).toBe(true)
          resolve()
        })
        expect(res.aborted).toBe(false)
        control.abort();
      })
      fetch(genUrl("/abort/deprecated"), { signal: control.signal }).catch(() => false)
    })
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
  testParseRange(module.parseRange)
  test("websockets", async () => {
    var client: WebSocket

    await new Promise<void>((resolve) => {
      server.ws<{ url: string }>("/ws", {
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
          if (runningTsd) {
            //websocket data is typed (but now as good as could be due to compatibility with uWS.HttpResponse
            expectType<HttpResponse<{ url: string }>>(res);
          }
        },
        open(ws) {
          if (runningTsd) {
            expectType<boolean>(ws.closed)
          }
          ws.sendFirstFragment("hello1\n ");
          ws.sendFragment("hello2\n ");
          ws.sendLastFragment("end hello");
        },
        close(ws) {
          //it is added manually, but exists in typescript as well
          ws.closed = true;
        },
        message(ws) {
          client.close();
          setTimeout(() => {
            expect(ws.closed).toBe(true)
            resolve();
          }, 10)
        },
      })
      client = new WebSocket("ws://localhost:" + port + "/ws", {});
      client.on("message", function(data) {
        expect(data.toString()).toBe("hello1\n hello2\n end hello")
        client.send("hello")
      })
    })
  })
}

export function testChannel(module: typeof import("@ublitzjs/core/channel")) {
  describe("Channel", () => {
    var Channel = module.Channel
    describe("at least", () => {
      it("is typed", () => {
        if (runningTsd) {
          type MessageT = { msg: string }
          let ch = new Channel<MessageT>()
          let cb = (data: string) => { data; }
          expectError(ch.sub(cb))
          var goodCb = (data: MessageT) => { data; }
          ch.sub(goodCb)
          expectError(ch.unsub(cb))
          ch.unsub(goodCb)
          expectError(ch.pub(""))
          ch.pub({ msg: "" })
        }
      })

      var ch = new Channel<number>();
      let cb1X = 0;
      let cb2X = 0;
      let cb3X = 0;
      let cb1 = (i: number) => { cb1X += i }
      let cb2 = (i: number) => { cb2X += i }
      let cb3 = (i: number) => { cb3X += i }
      function regAll() { ch.sub(cb1); ch.sub(cb2); ch.sub(cb3); }
      it("publishes messages repeatedly", () => {
        regAll()
        ch.pub(10); expect([cb1X, cb2X, cb3X]).toEqual([10, 10, 10])
        ch.pub(10); expect([cb1X, cb2X, cb3X]).toEqual([20, 20, 20])
      })
      it("removes listeners individually", () => {
        expect((cb1 as any).id).toBe(0)
        expect((cb2 as any).id).toBe(1)
        expect((cb3 as any).id).toBe(2)
        ch.unsub(cb2); ch.unsub(cb1); ch.unsub(cb3);
        ch.pub(10); expect([cb1X, cb2X, cb3X]).toEqual([20, 20, 20])
      })
      it("removes all listeners", () => {
        regAll(); ch.clear();
        ch.pub(10); expect([cb1X, cb2X, cb3X]).toEqual([20, 20, 20])
      })
      it("has 'self-deleting' listeners (once)", () => {
        ch.sub(cb1); function once(i: number) {cb2X+=i; ch.unsubCurrent();}; ch.sub(once)
        ch.pub(10); expect([cb1X, cb2X]).toEqual([30, 30])
        ch.pub(10); expect([cb1X, cb2X]).toEqual([40, 30])
      })
    })
  })
  describe("EventEmitter parody", () => {
    var EventEmitter = module.EventEmitter
    describe("at least", () => {
      it("is typed", () => {
        if (runningTsd) {
          type payload2 = { hello: 1 }
          let em = new EventEmitter<{ event1: string, event2: payload2 }>()
          em.on("event1", (data: string) => { data; })
          em.on("event2", (data: payload2) => { data; })

          expectError(em.on("event1", (data: number) => { data; }))
          expectError(em.on("event2", (data: string) => { data; }))
          expectError(em.on("event3", () => { }))

          em.removeAllListeners("event1")
          em.removeAllListeners()
          expectError(em.removeAllListeners("event3"))

          em.off("event1", (data: string) => { data; })
          expectError(em.off("event1", (data: number) => { data; }))
          em.off("event2", (data: payload2) => { data; })
          expectError(em.off("event2", (data: number) => { data; }))
          expectError(em.off("event3", () => { }))
          em.emit("event1", "")
          em.emit("event2", { hello: 1 })
          expectError(em.emit("event1", 1))
          expectError(em.emit("event2", { hello: 2 }))
          expectError(em.emit("event3", 1))
        }
      })

      var em = new EventEmitter<{ event: number }>;
      let cb1X = 0;
      let cb2X = 0;
      let cb3X = 0;
      let cb1 = (i: number) => { cb1X += i }
      let cb2 = (i: number) => { cb2X += i }
      let cb3 = (i: number) => { cb3X += i }
      function regAll() { em.on("event", cb1); em.on("event", cb2); em.on("event", cb3); }
      it("publishes messages repeatedly", () => {
        regAll()
        em.emit("event", 10); expect([cb1X, cb2X, cb3X]).toEqual([10, 10, 10])
        em.emit("event", 10); expect([cb1X, cb2X, cb3X]).toEqual([20, 20, 20])
      })
      it("removes listeners individually", () => {
        expect((cb1 as any).id).toBe(0)
        expect((cb2 as any).id).toBe(1)
        expect((cb3 as any).id).toBe(2)
        em.off("event", cb2); em.off("event", cb1); em.off("event", cb3);
        expect("id" in cb1).toBe(false)
        expect("id" in cb2).toBe(false)
        expect("id" in cb3).toBe(false)
        em.emit("event", 10); expect([cb1X, cb2X, cb3X]).toEqual([20, 20, 20])
      })
      it("publishes 'once' messages and removes listeners", () => {
        em.on("event", (i) => { cb1X += i })
        em.once("event", (i) => { cb2X += i })
        em.emit("event", 10); expect([cb1X, cb2X]).toEqual([30, 30])
        em.emit("event", 10); expect([cb1X, cb2X]).toEqual([40, 30])
        var cb = (i: number) => { cb2X += i }
        em.once("event", cb); em.offOnce("event", cb)
        em.emit("event", 10); expect([cb1X, cb2X]).toEqual([50, 30])
      })
      it("removes all listeners", () => {
        regAll(); em.removeAllListeners("event")
        em.emit("event", 10); expect([cb1X, cb2X, cb3X]).toEqual([50, 30, 20])
      })
    })
  })
}
