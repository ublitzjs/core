import runTests from "./all"
import {createRequire} from "node:module"
import {describe} from "vitest"
var require = createRequire(import.meta.url)
import * as esm from "@ublitzjs/core"
var cjs: any = require("@ublitzjs/core")
describe("ESM", ()=>runTests(esm))
describe("CJS", ()=>runTests(cjs))
