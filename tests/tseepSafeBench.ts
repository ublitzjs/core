/**This comparison will stay here. For some reason "tinybench" lets "tseep safe" win ALL tests, while here in manually written benchmark channel is FASTER*/
import {EventEmitter} from "tseep/lib/ee-safe.js"
import {Channel} from "@ublitzjs/core/channel"
var emitter = new EventEmitter;
var channel = new Channel;
function b() {}
emitter.on("", b)
channel.sub(b)
console.time("channel") // It is benchmarked first to show that "even startup code is faster"
for (var i = 0; i < 1_000_000; i++) {
  channel.pub(undefined)
}
console.timeEnd("channel")
console.time("tseep safe")
for (var i = 0; i < 1_000_000; i++) {
  emitter.emit("")
}
console.timeEnd("tseep safe")
