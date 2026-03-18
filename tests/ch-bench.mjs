import {Bench} from "tinybench"
import {EventEmitter as Tseep_ee} from "tseep"
import {EventEmitter as TseepSafe_ee} from "tseep/lib/ee-safe.js"
import {EventEmitter as Node_ee} from "node:events"
import {CozyEvent} from "cozyevent"
import {Channel} from "@ublitzjs/core/channel"
import {closure} from "@ublitzjs/core"

var errors = []

function speedOf(arg) { return arg.result.throughput.mean }
if(false)
closure(() => {
  console.log("creation time as of empty class")
  var bench = new Bench({ time: 1000 });
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
  if (diff > 1.1) errors.push(new Error("NOT FAST CREATION"))
})
//if(false)
closure(() => {
  console.log("10 listeners add + removeAllListeners (fast cleanup)")
  var tseep = new Tseep_ee();
  var tseepSafe = new TseepSafe_ee();
  var node = new Node_ee();
  var my = { 'foo': new Channel() }
  var cozy = new CozyEvent()
  var bench = new Bench({ time: 1000 });
  var arr = new Array(10);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = ()=>{}
  }
  bench.add("tseep", () => {
    for (var i = 0; i < arr.length; i++) {
      tseep.on('foo', arr[i]);
    }
    tseep.removeAllListeners('foo')
  }).add("channel", () => {
    for (var i = 0; i < arr.length; i++) {
      my['foo'].sub(arr[i]);
    }
    my.foo.clear()
  }).add("tseep safe", () => {
    for (var i = 0; i < arr.length; i++) {
      tseepSafe.on('foo', arr[i]);
    }
    tseepSafe.removeAllListeners('foo')
  }).add("node:events", () => {
    for (var i = 0; i < arr.length; i++) {
      node.on('foo', arr[i]);
    }
    node.removeAllListeners('foo')
  }).add("cozy", () => {
    for (var i = 0; i < arr.length; i++) {
      cozy.on('foo', arr[i]);
    }
    cozy.removeAllListeners('foo')
  })
  bench.runSync()
  console.table(bench.table())
  var [ tseepRes,myRes, tseepSafeRes, nodeRes, cozyRes] = bench.tasks
  if( speedOf(myRes) / speedOf(tseepRes) < 1.7
    || (speedOf(myRes) / speedOf(nodeRes)) < 1.3
    || (speedOf(myRes) / speedOf(cozyRes)) < 1.1
  ) errors.push(new Error("10 listeners + removeAllListeners NOT faster"))
})
if(false)
closure(() => {
  console.log("10 listeners add/remove individually")
  var tseep = new Tseep_ee();
  var tseepSafe = new TseepSafe_ee();
  var node = new Node_ee();
  var my = { 'foo': new Channel() }
  var cozy = new CozyEvent()
  var bench = new Bench({ time: 1000 });
  var arr = new Array(10);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = ()=>{}
  }
  bench.add("channel", () => {
    for (var i = 0; i < arr.length; i++) {
      my['foo'].sub(arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      my['foo'].unsub(arr[i]);
    }
  }).add("tseep", () => {
    for (var i = 0; i < arr.length; i++) {
      tseep.on('foo', arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      tseep.off('foo', arr[i]);
    }
  }).add("tseep safe", () => {
    for (var i = 0; i < arr.length; i++) {
      tseepSafe.on('foo', arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      tseepSafe.off('foo', arr[i]);
    }
  }).add("node:events", () => {
    for (var i = 0; i < arr.length; i++) {
      node.on('foo', arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      node.off('foo', arr[i]);
    }
  }).add("cozy", () => {
    for (var i = 0; i < arr.length; i++) {
      cozy.on('foo', arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      cozy.off('foo', arr[i]);
    }
  })
  bench.runSync()
  console.table(bench.table())
  var [myRes, tseepRes, tseepSafeRes, nodeRes, cozyRes] = bench.tasks
  if( speedOf(myRes) / speedOf(tseepRes) < 2.6
    || (speedOf(myRes) / speedOf(nodeRes)) < 3.5
    || (speedOf(myRes) / speedOf(cozyRes)) < 3.6
  ) errors.push(new Error("10 listeners individually NOT faster"))
})
//if(false)
closure(() => {
  console.log("1 listener publish (+ 'this' context) as without emitter")
  var ctx = { foo: "bar" }
  var bench = new Bench({ time: 1000 });
  function myHandle(args) {
    if (this.foo.length !== 3) throw new Error('test failed');
    if (this.foo.length !== 3 || args.length > 3) console.log('damn');
  }
  var handler = myHandle.bind(ctx)
  var tseepSafe = new TseepSafe_ee; tseepSafe.on("foo", handler)
  var my = { "foo": new Channel() }; my["foo"].sub(handler)
  bench.add("nothing", () => {
    handler([])
    handler(["bar"])
    handler(["bar", "baz"])
    handler(["bar", "baz", "boom"])
  }).add("channel", () => {
    my.foo.pub([])
    my.foo.pub(["bar"])
    my.foo.pub(["bar", "baz"])
    my.foo.pub(["bar", "baz", "boom"])
  }).add("safe tseep", () => {
    tseepSafe.emit("foo", [])
    tseepSafe.emit("foo", ["bar"])
    tseepSafe.emit("foo", ["bar", "baz"])
    tseepSafe.emit("foo", ["bar", "baz", "boom"])
  })

  bench.runSync()
  console.table(bench.table())
  var [nothingRes, myRes] = bench.tasks
  var vsNothing = speedOf(myRes) / speedOf(nothingRes);
  if(vsNothing < 0.92) errors.push(new Error("1 listeners 'pub' TOO SLOW", {cause:vsNothing}))
})
if(false)
closure(() => {
  console.log("'unrealistic' constant 'emit' with no add/remove")
  var tseep = new Tseep_ee();tseep.on("foo", bar).on("foo", baz).on("foo", foo)
  var node = new Node_ee(); node.on("foo", bar).on("foo", baz).on("foo",foo)
  var my = { 'foo': new Channel() }; my.foo.sub(bar); my.foo.sub(baz); my.foo.sub(foo)
  var cozy = new CozyEvent(); cozy.on("foo", bar); cozy.on("foo", baz); cozy.on("foo", foo)
  var bench = new Bench({ name: "add/remove 1 listener", time: 1000 });
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
  if( speedOf(tseepRes) / speedOf(myRes) > 1.15
    || (speedOf(myRes) / speedOf(nodeRes)) < 1.1
    || (speedOf(myRes) <= speedOf(cozyRes)) 
  ) errors.push(new Error("unrealistic 'emit' is slow"))
})
if(false)
closure(() => {
  console.log("3 constant listeners, add/remove 1 listener each '5 emit calls'")
  var tseep = new Tseep_ee();tseep.on("foo", bar).on("foo", baz).on("foo", foo)
  var node = new Node_ee(); node.on("foo", bar).on("foo", baz).on("foo",foo)
  var my = { 'foo': new Channel() }; my.foo.sub(bar); my.foo.sub(baz); my.foo.sub(foo)
  var cozy = new CozyEvent(); cozy.on("foo", bar); cozy.on("foo", baz); cozy.on("foo", foo)
  var bench = new Bench({ name: "add/remove 1 listener", time: 1000 });

  var payload = { a: 1, b: 2, c: new Array(100).fill("x") }

  function foo(arg) {
    if(arg!=payload) throw new Error("BAD")
  }
  function bar(arg) {
    if(arg!=payload) throw new Error("BAD")
  }
  function baz(arg) {
    if(arg!=payload) throw new Error("BAD")
  }
  function dynamic(arg) {
    if(arg!=payload) throw new Error("BAD")
  }
  bench.add("channel", () => {
    my.foo.sub(dynamic)
    my.foo.pub(payload)
    my.foo.pub(payload)
    my.foo.pub(payload)
    my.foo.pub(payload)
    my.foo.pub(payload)
    my.foo.unsub(dynamic)
  }).add("tseep", () => {
    tseep.on("foo", dynamic)
    tseep.emit("foo", payload)
    tseep.emit("foo", payload)
    tseep.emit("foo", payload)
    tseep.emit("foo", payload)
    tseep.emit("foo", payload)
    tseep.off("foo", dynamic)
  }).add("node:events", () => {
    node.on("foo", dynamic)
    node.emit("foo", payload)
    node.emit("foo", payload)
    node.emit("foo", payload)
    node.emit("foo", payload)
    node.emit("foo", payload)
    node.off("foo", dynamic)
  }).add("cozy", () => {
    cozy.on("foo", dynamic)
    cozy.emit("foo", payload)
    cozy.emit("foo", payload)
    cozy.emit("foo", payload)
    cozy.emit("foo", payload)
    cozy.emit("foo", payload)
    cozy.off("foo", dynamic)
  })
  bench.runSync()
  console.table(bench.table())
  var [myRes, tseepRes, nodeRes, cozyRes] = bench.tasks
  if(  speedOf(myRes)  / speedOf(tseepRes) < 6 // due to in-flight optimizations
    || (speedOf(myRes) / speedOf(nodeRes)) < 1.7
    || (speedOf(myRes) / speedOf(cozyRes)) < 1.1 // for 1 changing emitter cozy shines
  ) errors.push(new Error("realistic emit is slow"))
})
if(false)
closure(()=>{
  console.log("'once' listeners (for Channel - just .clear())")
  var tseep = new Tseep_ee();
  var node = new Node_ee();
  var my = { 'foo': new Channel() }
  var cozy = new CozyEvent()
  var bench = new Bench({ time: 1000 });
  var arr = new Array(10);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = ()=>{}
  }
  bench.add("tseep", () => {
    for (var i = 0; i < arr.length; i++) {
      tseep.once('foo', arr[i]);
    }
    tseep.emit('foo')
  }).add("channel", () => {
    for (var i = 0; i < arr.length; i++) {
      my['foo'].sub(arr[i]);
    }
    my.foo.pub(undefined)
    my.foo.clear()
  }).add("node:events", () => {
    for (var i = 0; i < arr.length; i++) {
      node.once('foo', arr[i]);
    }
    node.emit('foo')
  }).add("cozy", () => {
    for (var i = 0; i < arr.length; i++) {
      cozy.once('foo', arr[i]);
    }
    cozy.emit('foo')
  })
  bench.runSync()
  console.table(bench.table())
  var [myRes, tseepRes, nodeRes, cozyRes] = bench.tasks
  if( speedOf(myRes) < speedOf(tseepRes)
    || (speedOf(myRes) / speedOf(nodeRes)) < 7.6
    || (speedOf(myRes) / speedOf(cozyRes)) < 7.4
  ) errors.push(new Error("'once' too slow"))
})
if(false)
closure(() => {
  console.log("1000 listeners add/remove individually")
  var tseep = new Tseep_ee();
  tseep.setMaxListeners(1001)
  var node = new Node_ee();
  node.setMaxListeners(1001)
  var my = { 'foo': new Channel() }
  var cozy = new CozyEvent()

  var bench = new Bench({ time: 1000 });
  var arr = new Array(1000);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = ()=>{}
  }
  bench.add("channel", () => {
    for (var i = 0; i < arr.length; i++) {
      my['foo'].sub(arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      my['foo'].unsub(arr[i]);
    }
  }).add("tseep", () => {
    for (var i = 0; i < arr.length; i++) {
      tseep.on('foo', arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      tseep.off('foo', arr[i]);
    }
  }).add("node:events", () => {
    for (var i = 0; i < arr.length; i++) {
      node.on('foo', arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      node.off('foo', arr[i]);
    }
  }).add("cozy", () => {
    for (var i = 0; i < arr.length; i++) {
      cozy.on('foo', arr[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      cozy.off('foo', arr[i]);
    }
  })
  bench.runSync()
  console.table(bench.table())
  var [myRes, tseepRes, nodeRes, cozyRes] = bench.tasks
  if( speedOf(myRes) / speedOf(tseepRes) < 110
    || (speedOf(myRes) / speedOf(nodeRes)) < 70
    || (speedOf(myRes) / speedOf(cozyRes)) < 290
  ) errors.push(new Error("1000 listeners are too slow"))
})
closure(()=>{
  console.log("mixed creation + listeners + emit")
  var bench = new Bench({ time: 1000 });
  var arr = new Array(3);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = ()=>{}
  }
  bench.add("tseep", () => {
    var tseep = new Tseep_ee;
    tseep.on("foo", arr[0])
    tseep.on("foo", arr[1])
    tseep.once("foo", arr[2])
    tseep.emit("foo")
    tseep.emit("foo")
    tseep.emit("foo")
    tseep.emit("foo")
    tseep.emit("foo")
  }).add("channel", () => {
    var my = new EventEmitter;
    my.on("foo", arr[0])
    my.on("foo", arr[1])
    my.once("foo", arr[2])
    my.emit("foo")
    my.emit("foo")
    my.emit("foo")
    my.emit("foo")
    my.emit("foo")
  }).add("node:events", () => {
    var node = new Node_ee;
    node.on("foo", arr[0])
    node.on("foo", arr[1])
    node.once("foo", arr[2])
    node.emit("foo")
    node.emit("foo")
    node.emit("foo")
    node.emit("foo")
    node.emit("foo")
  }).add("cozy", () => {
    var cozy = new CozyEvent;
    cozy.on("foo", arr[0])
    cozy.on("foo", arr[1])
    cozy.once("foo", arr[2])
    cozy.emit("foo")
    cozy.emit("foo")
    cozy.emit("foo")
    cozy.emit("foo")
    cozy.emit("foo")
  })
  bench.runSync()
  console.table(bench.table())
  var [tseepRes, myRes, nodeRes, cozyRes] = bench.tasks
  if( speedOf(myRes) / speedOf(tseepRes) < 13
    || (speedOf(myRes) / speedOf(nodeRes)) < 3.8
    || (speedOf(myRes) / speedOf(cozyRes)) < 2
  ) errors.push(new Error("mixed creation+listeners+emit too slow"))
})
if(errors.length) {console.error(errors); process.exit(1)}


