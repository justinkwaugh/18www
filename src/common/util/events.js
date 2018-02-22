import EventEmitter from 'events';

class Events extends EventEmitter {

    off(type, listener) {
        this.removeListener(type, listener)
    }

}

export default new Events();