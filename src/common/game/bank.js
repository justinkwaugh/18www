import ko from 'knockout';
import _ from 'lodash';
import ValidationError from 'common/game/validationError';

class Bank {
    constructor(definition) {
        definition = definition || {};
        this.cash = ko.observable(definition.cash || 0);
        this.trainsByPhase = ko.observable(definition.trainsByPhase || {});
        this.certificates = ko.observableArray(definition.certificates || []);
        this.certificatesById = ko.computed(() => {
            return _.groupBy(this.certificates(), 'companyId');
        });
    }

    addCash(amount) {
        this.cash(this.cash() + amount);
    }

    removeCash(amount) {
        this.cash(this.cash() - amount);
    }

    removeCert(companyId) {
        const certs = this.certificates();
        const indexToRemove = _.findIndex(certs, {companyId});
        if(indexToRemove < 0) {
            throw ValidationError('Cert to remove from bank not found!');
        }
        const removedCert = _.pullAt(indexToRemove);
        this.certificates(certs);
        return removedCert;
    }

    numSharesOwnedOfCompany(companyId) {
        return _(this.certificatesById(companyId) || []).sumBy('shares');
    }
}

export default Bank;