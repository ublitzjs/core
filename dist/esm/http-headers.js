"use strict";
import { toAB } from "./index.js";
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
/**
 * A map containing all headers as ArrayBuffers, so speed remains. There are several use cases of it:
 * 1) Don't define them in requests ( post(res){new HeadersMap({...headers}).prepare().toRes(res)} ). This is slow. Define maps BEFORE actual usage.
 * 2) You can pass them in LightMethod or HeavyMethod in shared property (but handle it manually)
 * 3) Don't define them before writing status on request. uWebSockets.js after first written header considers response as successful and puts "200" code automatically. Set headers AFTER validation in class controllers (handler function) and after writing status (or don't write it at all. It will be 200).
 */
export class HeadersMap extends Map {
    currentHeaders;
    constructor(opts) {
        super();
        this.currentHeaders = opts;
    }
    ;
    /**
     * remove several headers from this map. Use BEFORE map.prepare(), because it will compare them by location in memory (string !== ArrayBuffer)
     * @example HeadersMap.default.remove("Content-Security-Policy", "X-DNS-Prefetch-Control", ...otherHeaders).prepare()
     */
    remove(...keys) {
        for (const key of keys)
            delete this.currentHeaders[key];
        return this;
    }
    /**
     * last function before "going to response". It converts all strings to ArrayBuffers, so you should delete unwanted headers before it
     * @returns function, which sets all headers on the response.
     * @example
     * new HeadersMap({...HeadersMap.baseObj,"a":"a"}).remove("a").prepare();
     */
    prepare() {
        for (const key in this.currentHeaders)
            this.set(toAB(key), toAB(this.currentHeaders[key]));
        delete this.currentHeaders;
        return (res) => {
            for (var pair of this)
                res.writeHeader(pair[0], pair[1]);
            return res;
        };
    }
    /**
     * write all static headers to response. Use BEFORE map.prepare function, because this function requires "currentHeaders" object.
     * @example
     * headersMap.toRes(res);
     */
    toRes(res) {
        var key;
        for (key in this.currentHeaders)
            res.writeHeader(key, this.currentHeaders[key]);
        return res;
    }
    /**
     * obj, containing basic headers, which u can use as a background for own headers. It is mutable, but doing so will modify "HeadersMap.default" behavior
     * @example
     * new HeadersMap({...HeadersMap.baseObj, "ownHeader":"hello world"}).remove("X-Download-Options")
     */
    static baseObj = helmetHeaders;
    /**
     * this is same as "toRes", but it uses HeadersMap.baseObj
     */
    static default(res) {
        var key;
        for (key in HeadersMap.baseObj)
            res.writeHeader(key, HeadersMap.baseObj[key]);
        return res;
    }
}
/**
 * This function creates Content-Security-Policy string.
 */
export function setCSP(mainCSP, ...remove) {
    var CSPstring = "";
    for (const dir of remove)
        delete mainCSP[dir];
    var key;
    for (key in mainCSP)
        CSPstring += key + " " + mainCSP[key].join(" ") + "; ";
    return CSPstring;
}
/**
 * Usual CSP directories. If you want more dirs:
 * 1) I will put more in soon
 * 2) use string concatenation (use BASE)
 * @example
 * new HeadersMap({...HeadersMap.baseObj, "Content-Security-Policy":setCSP({...CSPDirs}) + " your-dir: 'self';"})
 */
export var CSPDirs = {
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
    "worker-src": ["'self'"],
    "media-src": ["'self'"],
};
