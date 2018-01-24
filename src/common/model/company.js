import ko from 'knockout';
import _ from 'lodash';
import CurrentGame from 'common/game/currentGame';
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
        this.homeCellId = definition.homeCellId;

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
        this.closed = ko.observable(definition.closed || false);
        this.operated = ko.observable(definition.operated || false);
        this.routes = ko.observableArray(definition.routes || []);
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

    addCerts(certs) {
        this.certificates.push.apply(this.certificates, certs);
    }

    removeCerts(count) {
        return this.certificates.splice(0,count);
    }

    getPrivates() {
        return _(this.privates()).map(cert => CurrentGame().state().getCompany(cert.companyId)).sortBy('name').value();
    }

    hasPrivate(id) {
        return _.find(this.privates(), cert=> cert.companyId === id);
    }

    addPrivate(cert) {
        this.privates.push(cert);
    }

    removePrivate(id) {
        const privates = this.privates.remove(cert=> cert.companyId === id);
        return privates.length > 0 ? privates[0] : null;
    }

    addTrain(train) {
        this.trains.push(train);
    }

    removeTrainById(trainId) {
        return this.trains.remove(train=> train.id === trainId);
    }

    getAvailableRouteColor() {
        const currentColors = _.map(this.trains(), train=> train.route.color);
        return _(_.range(1,4)).difference(currentColors).first();
    }

    calculateRevenue() {
        return _.sumBy(this.trains(), train=> train.route.revenue());
    }

}

Company.registerClass();

export default Company;