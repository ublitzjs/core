import esbuild from "esbuild";
import process from "node:process";
/**
 * @type {esbuild.BuildOptions}
 */
const baseBundleOptions = {
  outdir: "dist",
  platform: "node",
  bundle: true,
  external: ["uWebSockets.js" /* MUST */],
  target: "node22",
  minify: true,
  format: "cjs",
  alias: {
    // for new convention
    stream: "node:stream",
    fs: "node:fs",
    crypto: "node:crypto",
    util: "node:util",
    process: "node:process",
    buffer: "node:buffer",
    // just for speed
    events: "tseep",
    "node:events": "tseep",
    timers: "node:timers",
  },
  charset: "utf8",
  ignoreAnnotations: false,
  resolveExtensions: [".mts", ".ts", ".js", ".mjs", ".cts", ".cjs"],
  tsconfig: "tsconfig.json"
};
await esbuild
  .build({
    ...baseBundleOptions,
    // use any file here considering the working directory
    entryPoints: ["examples/AsyncFunction.ts"],
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
