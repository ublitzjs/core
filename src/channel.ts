/**
* This is a type for callbacks, passed into "Channel". Note that it has an "id" property for O(1) lookup when removing items. Please, don't touch it.
* */
export type ChannelCB<T> = ((data: T)=>void) & {id: number}

//function pubSingle(this: Channel<any>, data:any) { if(this.cb)this.cb(data) }
function pubMulti(this: Channel<any>, data: any) { for (var cb of this.cb) cb(data) }
/**
* An event channel, pub/sub pattern, replacement (for ordinary event emitter. Creation is faster, removal is O(1) (callbacks get "id" property for this, don't touch it), hence is scalable. When has one listener (not when it had more and then left 1) - has optimization.  It is used in "HttpResponse.abortCh
* If you want to have something like "emitter.emit("event", data)" just create an object with channels: {"event": new Channel()}.
* It doesn't support "once" events, because all you need is just "clear" the channel for it. 
* It doesn't handle cases when you are deleting a listener within "pub" call. It can skip other listener. If you want both 'once' and 'on' listeners, create 2 separate channels for both handlers, for 'once' use "channel.clear()"
* Took some inspiration from tseep.
* @example
* // any message you'd like to send. It can be anything
* type MessageT = `hello, ${string}`
* var channel = new Channel<MessageT>()
* save function, but not anonymously (if you want then to remove it alone)
* function subscriber1 (message: MessageT) {
*   console.log("Here is a message", message)
* }
* channel.sub(subscriber1)
* function sub2 () {}
* channel.sub(sub2)
* // message is of MessageT
* channel.pub(`hello, MISTER ANDERSON`)
* // remove subscribers individually
* channel.unsub(subscriber1)
* // remove all subscribers at once
* channel.clear()
* */
export class Channel<MessageType> {
  /**
  * undefined | ChannelCB<T> | ChannelCB<T>[]
  * */
  protected cb: any = undefined;
  protected s: number = 0;
  /**find out if there are any active listeners*/
  get isEmpty() { return !this.cb }
  /**subscribe to channel.*/
  sub(fn: (msg: MessageType) => void) {
    switch (this.s) {
      case 2:
        (fn as any).id = this.cb.length; this.cb.push(fn); 
        break
      //case 1:
      //  this.cb.id = 0; (fn as any).id = 1;
      //  this.cb = [this.cb, fn]; this.s = 2; this.pub = pubMulti;
      //  break;
      default: this.cb = [fn]; (fn as any).id = 0; this.s=2; 
    }
  }
  /**unsubscribe from channel - remove only callbacks, that are definitely stored inside. Otherwise function throws an error*/
  unsub(fn: (msg: MessageType) => void) {
    if (this.s == 2) {
      let id: number = (fn as any).id
      if (id == this.cb.length - 1)
        this.cb.pop();
      else {
        let newCb = (this.cb[id] = this.cb.pop()); newCb.id = id;
      }
    } else {
      this.cb = undefined; this.s = 0; 
    }
  }
  /**publish a message to the whole channel. While the function is active, don't remove any of channel's listeners. */
  pub: (data: MessageType)=>void = pubMulti
  clear() {
   // if (this.s == 1) { this.cb = undefined; this.s = 0 } else 
      if(this.s) this.cb = []
  }
}

/**
 * @description it is not written to be actively used. If you use "Channel" you eliminate unwanted overhead of using "too universal" tool like this EventEmitter. Its main purpose is to combine 'on' and 'once' listeners.
 **/
export class EventEmitter<T extends Record<string|number|symbol, any>> {
  /**All events that you use. If you need both 'once' and 'on' but want to avoid built-in methods of 'EventEmitter', you can use 'events' manually.*/
  events: {
    [K in keyof T]: {
      on: Channel<T[K]>,
      once: Channel<T[K]>
    } | undefined
  } = {} as any
  on<K extends keyof T>(ev: K, handler: (this: Channel<T[K]>, data: T[K])=>void) {
    var obj = this.events[ev]
    if (!obj) obj = {
      on: new Channel(),
      once: new Channel()
    }
    obj.on.sub(handler)
  }
  once<K extends keyof T>(ev: K, handler: (this: Channel<T[K]>, data: T[K])=>void) {
    var obj = this.events[ev]
    if (!obj) obj = {
      on: new Channel(),
      once: new Channel()
    }
    obj.once.sub(handler)
  }
  /**Remove listener from event. For 'once' listeners you 'offOnce'*/
  off<K extends keyof T>(ev: K, handler: (this: Channel<T[K]>, data: T[K])=>void) {
    var obj = this.events[ev]
    if(!obj) return;
    obj.on.unsub(handler)
  }
  /**Remove 'once' listener from event*/
  offOnce<K extends keyof T>(ev: K, handler: (this: Channel<T[K]>, data: T[K])=>void) {
    var obj = this.events[ev]
    if(!obj) return;
    obj.once.unsub(handler)
  }
  emit<K extends keyof T>(ev: K, data: T[K]) {
    var obj = this.events[ev]
    if(!obj) return;
    obj.once.pub(data);
    obj.once.clear();
    obj.on.pub(data);
  }
  /**remove all listeners from specific event OR, if unspecificed, remove all events*/
  removeAllListeners(ev?: keyof T) {
    ev ? delete this.events[ev] : this.events = {} as any
  }
}
