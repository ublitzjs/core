/**
* This is a type for callbacks, passed into "Channel". Note that it has an "id" property for O(1) lookup when removing items. Please, don't touch it.
* */
export type ChannelCB<T> = ((data: T)=>void) & {id: number}

function pubOneOn(this: any, data:any) {
  this.on_cb(data)
}
function pubOn(this: any, data: any) {
    if (this.on_s == 2) {
     for (var cb of this.on_cb) cb(data)
    } else if(this.on_s) this.on_cb(data); 
}
function pub(this: any, msg: any) {
    if (this.on_s == 2) {
     for (var cb of this.on_cb) cb(msg)
    } else if(this.on_s) this.on_cb(msg); 

    if (!this.once_cb) return;
    if (this.once_s == 2) {
      for (var cb of this.on_cb) cb(msg)
    } else this.once_cb(msg);
    this.once_cb = undefined;this.once_s=0
}
/**
* An event channel, pub/sub pattern, replacement (for ordinary event emitter. Creation is faster, removal is O(1) (callbacks get "id" property for this, don't touch it), hence is scalable. When has one listener (not when it had more and then left 1) - has optimization. If you want to have something like "emitter.emit("event", data)" just create an object with channels: {"event": new Channel()}. It is used in "HttpResponse.abortCh"
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
export default class Channel<MessageType> {
  /**
  * undefined | ChannelCB<T> | ChannelCB<T>[]
  * */
  protected on_cb: any = undefined;
  protected on_s: number = 0
  protected once_cb: any = undefined;
  protected once_s: number = 0
  onceSub(fn: (msg: MessageType)=>void) {
    switch (this.once_s) {
      case 2:
        (fn as any).id = this.once_cb.length; this.once_cb.push(fn); break
      case 1:
        this.once_cb.id = 0; (fn as any).id = 1;
        this.once_cb = [this.once_cb, fn]; this.once_s=2; break;
      default:
        this.once_s = 1; this.once_cb = fn; this.pub = pub
    }
  }
  /**subscribe to channel.*/
  sub(fn: (msg: MessageType) => void) {
    switch (this.on_s) {
      case 2:
        (fn as any).id = this.on_cb.length; this.on_cb.push(fn);
        break
      case 1:
        this.on_cb.id = 0; (fn as any).id = 1;
        this.on_cb = [this.on_cb, fn]; this.on_s = 2; if (!this.once_s) this.pub = pubOn
        break;
      default: this.on_cb = fn; this.on_s=1; if(!this.once_s)this.pub = pubOneOn
    }
  }
  unsubOnce(fn: (msg: MessageType) => void) {
    if (this.once_s == 2) {
      switch ((fn as any).id) {
        case this.once_cb.length - 1:
          this.once_cb.pop();
          break;
        default:
          let newCb = this.once_cb.pop(); newCb.id = (fn as any).id;
          this.once_cb[(fn as any).id] = newCb;
      }
    } else {
      this.once_cb = undefined;this.once_s=0;
    }
  }
  /**unsubscribe from channel - remove only callbacks, that are definitely stored inside. Otherwise function throws an error*/
  unsub(fn: (msg: MessageType) => void) {
    switch (this.on_s) {
      case 2:
        switch ((fn as any).id) {
          case this.on_cb.length - 1:
            this.on_cb.pop();
            break;
          default:
            let newCb = this.on_cb.pop(); newCb.id = (fn as any).id;
            this.on_cb[(fn as any).id] = newCb;
        }
        break;
      default:
        this.on_cb = undefined; this.on_s=0;
        break;
    }
  }
  /**publish a message to the whole channel. While the function is active, don't remove any of channel's listeners. */
  pub: (data: MessageType)=>void = pub
  clear() { this.on_cb = undefined; this.once_cb = undefined }
}

