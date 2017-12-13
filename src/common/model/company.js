import ko from 'knockout';
import _ from 'lodash';
import StartCompany from '1846/actions/startCompany';
import Prices from '1846/config/prices';
import Serializable from 'common/model/serializable';


class Company extends Serializable {
    constructor(definition) {
        super();
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
        this.price = ko.computed(() => {
            return Prices.price(this.priceIndex() || 0);
        });
        this.lastRun = ko.observable(definition.lastRun);
        this.opened = ko.observable(definition.opened || false);
        this.operated = ko.observable(definition.operated || false);
    }

    toJSON() {
        const plainObject = super.toJSON();
        plainObject.certificates = this.certificates();
        plainObject.cash = this.cash();
        plainObject.tokens = this.tokens();
        plainObject.trains = this.trains();
        plainObject.president = this.president();
        plainObject.parPriceIndex = this.parPriceIndex();
        plainObject.priceIndex = this.priceIndex();
        plainObject.lastRun = this.lastRun();
        plainObject.opened = this.opened();
        plainObject.operated = this.operated();
        return plainObject;
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

Company.registerClass();

export default Company;