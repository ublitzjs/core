import esbuild from "esbuild";
/**
 * @type {esbuild.BuildOptions}
 */
const baseBundleOptions = {
  platform: "node",
  bundle: true,
  external: ["uWebSockets.js"],
  target: "node22",
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
  charset: "utf8",
  ignoreAnnotations: false,
  resolveExtensions: [".mts", ".ts", ".js", ".mjs", ".cts", ".cjs"],
};
/**
 *@param {"esm"|"cjs"} format
 * @returns {Promise<"OK" | Error>}
 */
var dir = "tests/esbuild/";
var tsconfigRaw = await fetch(
  "https://raw.githubusercontent.com/ublitzjs/core/refs/heads/main/tsconfig.json"
).then((res) => res.text());
export default async function (format) {
  var ext = format === "esm" ? "mjs" : "cjs";
  try {
    await esbuild.build({
      ...baseBundleOptions,
      outfile: dir + "compiled." + ext,
      format,
      tsconfigRaw,
      entryPoints: [dir + "app." + ext],
    });
    return "OK";
  } catch (error) {
    return error;
  }
}
