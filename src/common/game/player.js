import ko from 'knockout';

class Player {
    constructor(definition) {
        this.user = ko.observable(definition.user);
        this.cash = ko.observable(definition.cash || 0);
        this.certificates = ko.observableArray(definition.certificates);
    }
}

export default Player;