import ko from 'knockout';
import short from 'short-uuid';
import _ from 'lodash';
import Serializable from 'common/model/serializable';

class BasePlayer extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super(definition);
        this.id = definition.id || short().new();
        this.user = ko.observable(definition.user);
        this.cash = ko.observable(definition.cash || 0);
        this.worth = ko.observable(definition.worth || 0);
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
}

export default BasePlayer;