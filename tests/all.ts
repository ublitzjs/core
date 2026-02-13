import {describe, it, expect, test, afterAll} from "vitest"
import WebSocket from "ws"
import { App,
  us_listen_socket_close,
  type HttpResponse as uwsHttpResponse,
  type us_listen_socket,
  us_socket_local_port 
} from "uWebSockets.js"
import {expectError, expectType} from "tsd"
import type {
  onlyHttpMethods,
  routeFNOpts,
  HttpResponse,
  lowHeaders
} from "@ublitzjs/core"
var runningTsd: boolean = false;

export default async function(module: typeof import('@ublitzjs/core')){
  var server = module.extendApp(App(), {a: 10} as const, {b: "b"} as const);
  var port: number;
  var socket: us_listen_socket;
  var basicResponse = "hello";
  function genUrl(url: string){
    return "http://localhost:" + port + url;
  }
  describe("basic functionality of extendApp", ()=>{
    it("extends", ()=>{
      // here typescript compiler won't let untyped data stay invisible
      expect(server.get.apply).toBeDefined()
      expect(server.a).toBe(10);
      expect(server.b).toBe("b")
      if(runningTsd){
        expectType<10>(server.a)
        expectType<"b">(server.b)
      }
    })
    it("enables 'register' and 'onError'", ()=>{
      var didRun: boolean = false;
      server.register((serverAgain)=>{
        didRun = true;
        expect(server).toBe(serverAgain);
        if(runningTsd){
          expectType<typeof server>(serverAgain)
        }
      })
      expect(didRun).toBe(true);
      function onError(){ } //just to be
      server.onError(onError)
      expect(server._errHandler).toBe(onError)
    })
    it("has mechanism for server preparation", async ()=>{
      var first = false;
      var second = false;
      server.awaitLater(Promise.resolve().then(()=>{first = true}), Promise.resolve().then(()=>{second = true;}))
      expect(server._startPromises.length).toBe(2)
      expect([first, second]).toEqual([false, false])
      await server.ready();
      expect([first, second]).toEqual([true, true])
      expect(server._startPromises.length).toBe(0)
    })
    it("has special 'route' (just its assignment)", ()=>{
      type compileTimeOptions = {deprecated: boolean}
      var lastDeprecatedMethod: onlyHttpMethods | undefined;
      function markDeprecation(opts: routeFNOpts<onlyHttpMethods> & compileTimeOptions){
        if(opts.deprecated) lastDeprecatedMethod = opts.method
      }
      server.route<onlyHttpMethods, compileTimeOptions>({
        method: "get",
        path: "/route",
        controller(res){ res.end(basicResponse) },
        deprecated: true
      }, [markDeprecation])
      if(runningTsd){
        expectError(
          server.route<"abcd">({
            controller(){},
            method:"abcd",
            path: "/"
          })
        )
        expectError(
          server.route<onlyHttpMethods, compileTimeOptions>({
            controller(){}, method: "get", path: "/"
          })
        )
      }
      expect(lastDeprecatedMethod).toBe("get")
    })
  })
  test("closure is a closure indeed", ()=>{
    var result = module.closure(()=>{
      var x = { "a": 10 } as const;
      return x;
    })
    expect(result["a"]).toBe(10)
    if(runningTsd){
      expectType<{ readonly "a": 10 }>(result)
    }
  })
  test("Content-Security-Policy generator", ()=>{
    var result = module.setCSP({ "connect-src": ["'self'"], "style-src": ["'self'"]})
    expect(result).toBe("connect-src 'self'; style-src 'self'; ")

    expect(module.CSPDirs["connect-src"]).toEqual(["'self'"])
    result = module.setCSP(module.CSPDirs, "connect-src")
    expect([ result.search("style-src") != -1, result.search("connect-src") == -1]).toEqual([true, true])
  })
  test("to arrayBuffer", ()=>{
    expect(new TextDecoder().decode(module.toAB(basicResponse))).toBe(basicResponse)
  })
  await new Promise<void>((resolve, reject)=>{
    server.listen("localhost", 0, (listenSocket)=>{
      port = us_socket_local_port(listenSocket);
      socket = listenSocket;
      if(!socket) reject();
      resolve();
    })
  })
  afterAll(()=>{ us_listen_socket_close(socket) })
  test("'route' method from extendApp actually works", async ()=>{
    expect(await fetch(genUrl("/route")).then(res=>res.text())).toBe(basicResponse)
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
  test("HeadersMap", async()=>{
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
    if(runningTsd){
      var a: any;
      expectType<uwsHttpResponse>(writeHeaders(a as uwsHttpResponse))
      expectType<HttpResponse<{}>>(writeHeaders(a as HttpResponse))
      type userRes = HttpResponse<{id: number}> & {userKey: string}
      expectType<userRes>(writeHeaders(a as userRes))
      // but it accepts only response object
      expectError(writeHeaders(a as number))
    }
  })
  describe("route helpers", ()=>{
    it("seeOtherMethods", async ()=>{
      server.any("/seeOther", module.seeOtherMethods(["ws", "del", "get", "post"]))
      var result = await fetch(genUrl("/seeOther"))
      var header =  result.headers.get("Allow")
      expect(header).toBe("DELETE, GET, POST")
    })
    it("notFoundConstructor", async ()=>{
      var response = "NOT FOUND!!!"
      server.any("/no", module.notFoundConstructor(response))
      var result = await fetch(genUrl("/no"))
      expect(result.status).toBe(404)
      expect(await result.text()).toBe(response)
    })
    it("badRequest", async ()=>{
      server.get("/bad", (res)=>{
        try {
          module.badRequest(res, "it is an error", "JUST BECAUSE");
        } catch (err){
          expect((err as Error).cause).toBe("JUST BECAUSE")
        }
      })
      var result = await fetch(genUrl("/bad"))
      expect(result.status).toBe(400)
      expect(await result.text()).toBe("it is an error")
    })
    it("tooLargeBody", async ()=>{
      server.get("/bad", (res)=>{
        module.tooLargeBody(res, 10);
      })
      var result = await fetch(genUrl("/bad"))
      expect(result.status).toBe(413)
      expect(await result.text()).toBe("Body is too large. Limit in bytes - 10")
    })
    it("checkContentLength", async ()=>{
      server.post("/cl", (res, req)=>{
        var CL: number;
        try {
          CL = module.checkContentLength(res, req);
        } catch (err) { console.log(err) }
        expect(CL!).toBe(1)
        res.endWithoutBody();
      })
      var result = await fetch(genUrl("/cl"), {method: "post", body: "a"})
      expect(result.status).toBe(200)
    })
  })
  test("registerAbort", async ()=>{
    var control = new AbortController();
    server.get("/abort", async (res)=>{
      module.registerAbort(res)
      res.emitter.once("abort", ()=>{
        expect(res.aborted).toBe(true)
      })
      expect(res.aborted).toBeFalsy()
      control.abort();
    })
    var result = await fetch(genUrl("/abort"), {signal: control.signal}).catch(()=>false)
    expect(result === false).toBe(true)
  })

  test("websockets", async ()=>{
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
