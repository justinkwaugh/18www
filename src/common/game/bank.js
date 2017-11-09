import ko from 'knockout';

class Bank {
    constructor(definition) {
        definition = definition || {};
        this.cash = ko.observable(definition.cash || 0);
        this.trainsByPhase = ko.observable(definition.trainsByPhase || {});
        this.certificates = ko.observableArray(definition.certificates || []);
    }
}

export default Bank;