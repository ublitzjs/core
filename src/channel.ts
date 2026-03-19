/**
* This is a type for callbacks, passed into "Channel". Note that it has an "id" property for O(1) lookup when removing items. Please, don't touch it.
* */
export type ChannelCB<T> = ((data: T)=>void) & {id: number}

/**
* An event channel, pub/sub pattern, replacement (for ordinary event emitter. Creation is faster, removal is O(1) (callbacks get "id" property for this, don't touch it), hence is scalable (but order of listeners is not preserved). It is used in "HttpResponse.abortCh
* If you want to have something like "emitter.emit("event", data)" just create an object with channels: {"event": new Channel()}.
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
* function selfUnsubListener() {channel.unsubCurrent()}
* channel.sub(selfUnsubListener)
* // message is of MessageT
* channel.pub(`hello, MISTER ANDERSON`) // it unsubs seldUnsubListener
* // remove subscribers individually
* channel.unsub(subscriber1)
* // remove all subscribers at once
* channel.clear()
* */
export class Channel<MessageType> {
  protected cbs: ChannelCB<MessageType>[] = [];
  protected i: number = 0;
  /**find out if there are any active listeners*/
  get isEmpty() { return !this.cbs.length }
  /**subscribe listener to channel. This method attaches "id" property to listener. Don't modify it.*/
  sub(fn: (msg: MessageType) => void) {
    var cbs = this.cbs; 
    (fn as any).id = cbs.length; cbs.push(fn as any);  
  }
  /**lets you unsubscribe listeners. It uses "listener.id" property for O(1) speed, so don't touch it. 
  * "unsub" replaces removed listener with the last-registered, so order changes.*/
  unsub(fn: (msg: MessageType) => void) {
    var cbs = this.cbs
    let id: number = (fn as any).id
    if (id == cbs.length - 1)
      cbs.pop();
    else {
      let newCb = (cbs[id] = cbs.pop()!); newCb.id = id;
    }
  }
  /**
  * this function lets you unsubscribe the listener, which is currently used in "pub" function.
  * @example 
  * var ch = new Channel();
  * function once(msg) {console.log(msg); ch.unsubCurrent()}
  * ch.sub(once); 
  * ch.pub("hello")
  * // here once is not registered
  * ch.pub("world")
  * */
  unsubCurrent() {
    var cbs = this.cbs;
    if(this.i == cbs.length - 1) {cbs.pop(); return;};
    var newCb = (cbs[this.i] = cbs.pop()!); newCb.id = this.i--;
  }
  /**Publish some data to all listeners. You can remove listeners on the fly by using "unsubCurrent" (see example in jsdoc of unsubCurrent)*/
  pub(data: MessageType){
    var cbs = this.cbs
    while(this.i < cbs.length) {
      cbs[this.i]!(data);
      this.i++
    }
      this.i = 0
  } 
  clear() { this.cbs = [] }
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
    if (!obj) this.events[ev] = obj = {
      on: new Channel(),
      once: new Channel()
    }
    obj.on.sub(handler)
  }
  once<K extends keyof T>(ev: K, handler: (this: Channel<T[K]>, data: T[K])=>void) {
    var obj = this.events[ev]
    if (!obj) this.events[ev] = obj = {
      on: new Channel(),
      once: new Channel()
    }
    obj.once.sub(handler)
  }
  /**Remove listener from event. For 'once' listeners you 'offOnce'*/
  off<K extends keyof T>(ev: K, handler: (this: Channel<T[K]>, data: T[K])=>void) {
    var obj = this.events[ev]
    if(!obj || !("id" in handler)) return;
    obj.on.unsub(handler)
    delete handler.id
  }
  /**Remove 'once' listener from event*/
  offOnce<K extends keyof T>(ev: K, handler: (this: Channel<T[K]>, data: T[K])=>void) {
    var obj = this.events[ev]
    if(!obj || !("id" in handler)) return;
    obj.once.unsub(handler)
    delete handler.id
  }
  /**Here message first goes to "once" listeners, then - 'on'*/
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
