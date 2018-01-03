import ko from 'knockout';
import short from 'short-uuid';
import _ from 'lodash';
import Serializable from 'common/model/serializable';
import ValidationError from 'common/game/validationError';

class BasePlayer extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super(definition);
        this.id = definition.id || short().new();
        this.user = ko.observable(definition.user);
        this.cash = ko.observable(definition.cash || 0);
        this.worth = ko.observable(definition.worth || 0);
        this.order = ko.observable(definition.order || 0);
        this.certificates = ko.observableArray(definition.certificates);
        this.certificatesById = ko.computed(() => {
            return _.groupBy(this.certificates(), 'companyId');
        });

        this.ownedCompanyIds = ko.computed(()=> {
            return _.keys(this.certificatesById()).sort();
        });

        this.presidentCompanyIds = ko.computed(()=> {
            return _(this.certificates()).filter( { president : true } ).sortBy('companyId').map('companyId').value();
        });

        this.sharesPerCompany = ko.computed(()=> {
            return _(this.ownedCompanyIds()).zipObject(_.map(this.ownedCompanyIds(), companyId => _.sumBy(this.certificatesById()[companyId],'shares'))).value();
        });

        this.popoverParams = {
            content: '<div data-bind="template: { name: \'views/playerPopover\' }"></div>'
        };

        this.name = ko.computed(() => {
            const user = this.user();
            return user ? user.username : this.id;
        });
    }

    addCash(amount) {
        this.cash(this.cash() + amount);
    }

    removeCash(amount) {
        this.cash(this.cash() - amount);
    }

    isPresidentOfCompany(companyId) {
        return _.indexOf(this.presidentCompanyIds(), companyId) >= 0;
    }

    numSharesOwnedOfCompany(companyId) {
        return this.sharesPerCompany()[companyId] || 0;
    }

    addCert(cert) {
        this.certificates.push(cert);
    }

    addCerts(certs) {
        this.certificates.push.apply(this.certificates, certs);
    }

    removeNonPresidentCertsForCompany(count, companyId) {
        const numShares = this.sharesPerCompany()[companyId];
        if(numShares < count || this.isPresidentOfCompany(companyId) && numShares < count + 2) {
            throw new ValidationError('Not enough shares!');
        }

        const certIdsToRemove = _(this.certificatesById()[companyId]).sortBy('president').reverse().take(count).map('id').value();
        return this.certificates.remove(cert=>{
            return _.indexOf(certIdsToRemove, cert.id) >= 0;
        });
    }

    removePresidentCertForCompany(companyId) {
        if(!this.isPresidentOfCompany(companyId)) {
            throw new ValidationError('No director Cert!');
        }

        return this.certificates.remove(cert=> {
            return cert.companyId === companyId && cert.president;
        })[0];
    }

    removePrivate(id) {
        const privates = this.certificates.remove(cert=> cert.companyId === id);
        return privates.length > 0 ? privates[0] : null;
    }

    toJSON() {
        const plainObject = super.toJSON();
        delete plainObject.popoverParams;
        return plainObject;
    }
}

export default BasePlayer;