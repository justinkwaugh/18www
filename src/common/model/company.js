import ko from 'knockout';


class Company {
    constructor(definition) {
        definition = definition || {};
        this.id = definition.id;
        this.name = definition.name || 'Anonymous';
        this.nickname = definition.nickname || 'Anon';
        this.type = definition.type;
        this.certificates = ko.observableArray(definition.certificates);
        this.shares = ko.observable(definition.shares || 10);
        this.cash = ko.observable(definition.cash || 0);
        this.tokens = ko.observable(definition.tokens || 0);
        this.privates = ko.observableArray(definition.privates || []);
        this.trains = ko.observableArray(definition.trains || []);
        this.owner = ko.observable(definition.owner);
        this.sharePrice = ko.observable(definition.sharePrice);
        this.lastRun = ko.observable(definition.lastRun);
    }
}

export default Company;