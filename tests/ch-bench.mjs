import {Bench} from "tinybench"
import {EventEmitter as Tseep_ee} from "tseep"
import {EventEmitter as Node_ee} from "node:events"
import {CozyEvent} from "cozyevent"
import Channel from "@ublitzjs/core/events"
import {closure} from "@ublitzjs/core"
function speedOf(arg) { return arg.result.throughput.mean }
if(false)
closure(() => {
  console.log("creation time as of empty class")
  var bench = new Bench({ time: 500 });
  class Empty {}
  bench.add("empty", ()=>{
    new Empty()
  }).add("channel", () => {
    new Channel()
  })
  bench.runSync()
  var [emptyRes, myRes] = bench.tasks
  // might happen if didn't warmup properly
  var diff = speedOf(emptyRes) > speedOf(myRes) ? speedOf(emptyRes) / speedOf(myRes) : speedOf(myRes) / speedOf(emptyRes)
  console.table(bench.table())
  if (diff > 1.1) throw new Error("NOT FAST CREATION")
})
if(false)
closure(() => {
  console.log("faster 1 listener add/remove")
  var tseep = new Tseep_ee();
  var node = new Node_ee();
  var my = { 'foo': new Channel() }
  var cozy = new CozyEvent()
  var bench = new Bench({ time: 500 });

  function handle() { } 
  bench.add("channel", () => {
    my['foo'].sub(handle);
    my['foo'].unsub(handle)
  }).add("tseep", () => {
    tseep.on('foo', handle);
    tseep.off('foo', handle)
  }).add("node:events", () => {
    node.on('foo', handle);
    node.off('foo', handle)
  }).add("cozy", () => {
    cozy.on('foo', handle);
    cozy.off('foo', handle)
  })
  bench.runSync()
  console.table(bench.table())
  var [myRes, tseepRes, nodeRes, cozyRes] = bench.tasks
  if( speedOf(myRes) < speedOf(tseepRes)
    || (speedOf(myRes) / speedOf(nodeRes)) < 1.4
    || (speedOf(myRes) / speedOf(cozyRes)) < 1.8
  ) throw new Error("1 event is not faster")
})
closure(() => {
  console.log("handles context (speed is comparable to emitter absence)")
  var ctx = { foo: "bar" }
  var bench = new Bench({ time: 500 });
  function myHandle(args) {
    if (this.foo.length !== 3) throw new Error('test failed');
    if (this.foo.length !== 3 || args.length > 3) console.log('damn');
  }
  var handler = myHandle.bind(ctx)
  var my = { "foo": new Channel() }; my["foo"].sub(handler)
  bench.add("nothing", () => {
    handler([])
    handler(["bar"])
    handler(["bar", "baz"])
    handler(["bar", "baz", "boom"])
  }).add("µBlitz.js events", () => {
    my.foo.pub([])
    my.foo.pub(["bar"])
    my.foo.pub(["bar", "baz"])
    my.foo.pub(["bar", "baz", "boom"])
  })
  bench.runSync()
  console.table(bench.table())
  var [nothingRes, myRes] = bench.tasks
  var vsNothing = speedOf(myRes) / speedOf(nothingRes);
  if(vsNothing < 0.92) throw new Error("DIFFERENCE IS TOO BIG", {cause:vsNothing})
})
closure(() => {
  console.log("faster 3 listener add/remove")
  var tseep = new Tseep_ee();tseep.on("foo", bar).on("foo", baz).on("foo", foo)
  var node = new Node_ee(); node.on("foo", bar).on("foo", baz).on("foo",foo)
  var my = { 'foo': new Channel() }; my.foo.sub(bar); my.foo.sub(baz); my.foo.sub(foo)
  var cozy = new CozyEvent(); cozy.on("foo", bar); cozy.on("foo", baz); cozy.on("foo", foo)
  var bench = new Bench({ name: "add/remove 1 listener", time: 500 });
  function foo() {
    if (arguments.length > 100) console.log('damn');

    return 1
  }

  function bar() {
    if (arguments.length > 100) console.log('damn');

    return false;
  }

  function baz() {
    if (arguments.length > 100) console.log('damn');

    return true;
  }
  bench.add("channel", () => {
    my.foo.pub("SOME LARGE DATA")
  }).add("tseep", () => {
    tseep.emit("foo", "SOME LARGE DATA")
  }).add("node:events", () => {
    node.emit("foo", "SOME LARGE DATA")
  }).add("cozy", () => {
    cozy.emit("foo", "SOME LARGE DATA")
  })
  bench.runSync()
  console.table(bench.table())
  var [myRes, tseepRes, nodeRes, cozyRes] = bench.tasks
  if( speedOf(myRes) < speedOf(tseepRes)
    || (speedOf(myRes) / speedOf(nodeRes)) < 1.4
    || (speedOf(myRes) / speedOf(cozyRes)) < 1.8
  ) throw new Error("1 event is not faster")
})
