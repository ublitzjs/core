"use strict";
var { toAB } = require("./index.cjs");
var helmetHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-DNS-Prefetch-Control": "off",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-Download-Options": "noopen",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Origin-Agent-Cluster": "?1",
  //"Content-Security-Policy-Report-Only":"",
  //"Strict-Transport-Security":`max-age=${60 * 60 * 24 * 365}; includeSubDomains`,
};
class HeadersMap extends Map {
  constructor(opts) {
    super();
    this.currentHeaders = opts;
  }
  remove(keys) {
    for (const key of arguments) delete this.currentHeaders[key];
    return this;
  }
  prepare() {
    for (const key in this.currentHeaders)
      this.set(toAB(key), toAB(this.currentHeaders[key]));
    return delete this.currentHeaders, (res) => this.toRes(res);
  }
  toRes(res) {
    for (const pair of this) res.writeHeader(pair[0], pair[1]);
    return res;
  }
  static baseObj = helmetHeaders;
}
function setCSP(mainCSP, ...remove) {
  var CSPstring = "";
  for (const dir of remove) delete mainCSP[dir];
  for (var key in mainCSP)
    CSPstring += key + " " + mainCSP[key].join(" ") + " ";
  return CSPstring;
}
var CSPDirs = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "font-src": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "img-src": ["'self'"],
  "connect-src": ["'self'"],
  "object-src": ["'none'"],
  "script-src": ["'self'"],
  "script-src-attr": ["'none'"],
  "script-src-elem": ["'self'"],
  "style-src": ["'self'"],
  "style-src-attr": ["'none'"],
  "style-src-elem": ["'self'"],
  "trusted-types": ["'none'"],
  "upgrade-insecure-requests": [],
  "worker-src": ["'self'"],
  "media-src": ["'self'"],
};
module.exports = { CSPDirs, HeadersMap, setCSP };
