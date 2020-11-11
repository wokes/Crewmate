import { EventEmitter2 } from 'eventemitter2'

class EventEmitter extends EventEmitter2 {
  constructor() {
    super({
      wildcard: true
    })
  }
}

export default EventEmitter
