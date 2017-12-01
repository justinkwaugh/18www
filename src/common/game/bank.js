import ko from 'knockout';
import _ from 'lodash';
import ValidationError from 'common/game/validationError';
import Serializable from 'common/model/serializable';

class Bank extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super(definition);
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
        const removedCert = _.pullAt(certs, indexToRemove)[0];
        this.certificates(certs);
        return removedCert;
    }

    numSharesOwnedOfCompany(companyId) {
        return _(this.certificatesById()[companyId] || []).sumBy('shares');
    }
}

Bank.registerClass();

export default Bank;