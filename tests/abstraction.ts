import {mkdirSync, rmSync} from "node:fs"
import {afterAll, describe} from "vitest"
import {build, type BuildOptions} from "esbuild"
import {cwd} from "node:process"
import {resolve} from "node:path"
import { createRequire } from "node:module"
import * as tests from "./all"
type Module = {
  name: string;
  normalESM: any,
  normalCJS: any,
  test: keyof typeof import("./all")
}

var require = createRequire(import.meta.url)
var tmpDir = resolve(cwd(), "tmp");
try { mkdirSync(tmpDir) } catch {}
afterAll(()=>{rmSync(tmpDir, {force: true, recursive: true})})

export default async function(externalLibraries: string[], testedModules: Module[]){
  var buildOptions: BuildOptions = {
    platform: "node",
    bundle: true,
    external: externalLibraries,
    target: "node25",
    minify: true,
    alias: {
      stream: "node:stream",
      fs: "node:fs",
      crypto: "node:crypto",
      util: "node:util",
      process: "node:process",
      buffer: "node:buffer",
      events: "tseep",
      "node:events": "tseep",
      timers: "node:timers",
    },
    minifyIdentifiers: false,
    charset: "utf8",
    ignoreAnnotations: false,
    resolveExtensions: [".mts", ".ts", ".js", ".mjs", ".cts", ".cjs"],
  }
  await Promise.all([
    build({
      ...buildOptions,
      format: "esm",
      entryPoints: testedModules.map(val=>resolve(cwd(), "dist/esm/"+val.name)),
      outdir: resolve(tmpDir, "esm"),
    }),
    build({
      ...buildOptions,
      format: "cjs",
      entryPoints: testedModules.map(val=>resolve(cwd(), "dist/cjs/"+val.name)),
      outdir: resolve(tmpDir, "cjs"),
    })
  ])
  describe("CJS", ()=>{
    describe("NORMAL", ()=>{
      for (var module of testedModules) {
        tests[module.test](module.normalCJS)
      }
    })
    describe("MINIFIED", ()=>{
      for (var module of testedModules) {
        tests[module.test](require(resolve(tmpDir, "cjs", module.name)))
      }
    })
  })
  describe("ESM", ()=>{
    describe("NORMAL", ()=>{
      for (var module of testedModules) {
        tests[module.test](module.normalESM)
      }
    })
    describe("MINIFIED", async () => {
      for (var module of testedModules) {
        tests[module.test](await import(resolve(tmpDir, "esm", module.name)))
      }
    })
  })
}

