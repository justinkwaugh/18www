import ko from 'knockout';


class Company {
    constructor(definition) {
        definition = definition || {};
        this.id = definition.id;
        this.name = definition.name || 'Anonymous';
        this.type = definition.type;
        this.certificates = ko.observableArray(definition.certificates);
        this.shares = ko.observable(definition.shares || 10);
        this.cash = ko.observable(definition.cash || 0);
        this.tokens = ko.observable(definition.tokens || 0);
        this.privates = ko.observableArray();
        this.trains = ko.observableArray();
        this.owner = ko.observable();
        this.stockPrice = ko.observable();
        this.lastRun = ko.observable();
    }
}

export default Company;