import Events from 'common/util/events'

class History {
        constructor () {
            this.history = window.history && window.history.pushState ? window.history : { pushState: function() {}, replaceState: function() {}, back: function() {}, state: null };
            window.onpopstate = function(event) {
                Events.emit('nav-change', event.state);
            };

            Events.on('app-ready', ()=> {
                Events.emit('nav-change', this.history.state);
            });
        }

        pushState(state, title, url) {
            self.history.pushState(state,title,url);
        }

        replaceState(state, title, url) {
            self.history.replaceState(state,title,url);
        }

        back() {
            self.history.back();
        }
    }

    export default new History()