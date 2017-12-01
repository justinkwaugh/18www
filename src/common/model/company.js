import ko from 'knockout';
import _ from 'lodash';
import StartCompany from '1846/actions/startCompany';


class Company {
    constructor(definition) {
        definition = definition || {};
        this.id = definition.id;
        this.name = definition.name || 'Anonymous';
        this.nickname = definition.nickname || 'Anon';
        this.type = definition.type;
        this.certificates = ko.observableArray(definition.certificates);
        this.shares = ko.computed(()=> {
            return _.sumBy(this.certificates(), 'shares');
        });
        this.cash = ko.observable(definition.cash || 0);
        this.tokens = ko.observable(definition.tokens || 0);
        this.privates = ko.observableArray(definition.privates || []);
        this.trains = ko.observableArray(definition.trains || []);
        this.president = ko.observable(definition.president);
        this.parPriceIndex = ko.observable(definition.parPriceIndex || 0);
        this.priceIndex = ko.observable(definition.priceIndex || 0);
        this.lastRun = ko.observable(definition.lastRun);
        this.opened = ko.observable(definition.opened || false);
    }

    addCash(amount) {
        this.cash(this.cash() + amount);
    }

    removeCash(amount) {
        this.cash(this.cash() - amount);
    }

    start(state, playerId) {
        new StartCompany({playerId, companyId: this.id, startIndex: 7}).execute(state);
    }

}

export default Company;