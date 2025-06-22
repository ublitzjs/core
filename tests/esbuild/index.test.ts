"use strict";
import { describe, it, expect } from "vitest";
import build from "./build.mjs";
import {
  us_listen_socket_close,
  us_socket_local_port,
  type us_listen_socket,
} from "uWebSockets.js";
import { request } from "undici";
import { createRequire } from "node:module";
var require = createRequire(import.meta.url);
var describeOpts = { skip: false, retry: 0, repeats: 0, sequential: true };
function returnTestBuild(format: "esm" | "cjs") {
  var ext = format === "esm" ? "mjs" : "cjs";
  var port: number;
  var link: string;
  var listen_socket: us_listen_socket;
  return () => {
    it(`builds`, async () => expect(await build(format)).toBe("OK"));

    it("starts", async () => {
      var path = "./compiled." + ext;
      var start =
        format === "esm" ? (await import(path)).default : require(path);
      expect(start).toBeTruthy();
      listen_socket = await start(0);
      port = us_socket_local_port(listen_socket);
      link = `http://localhost:${port}`;
    });

    it("sends 404 code on undefined route", async () => {
      const res = await request(link + "/any");
      expect(res.statusCode).toBe(404);
      expect(await res.body.text()).toBe(
        "Mr. Someone. You've mistaken the link"
      );
    });

    it("shuts down", () =>
      expect(us_listen_socket_close(listen_socket)).toBe(undefined));
  };
}
describe("esm esbuild", describeOpts, returnTestBuild("esm"));
describe("cjs esbuild", describeOpts, returnTestBuild("cjs"));
