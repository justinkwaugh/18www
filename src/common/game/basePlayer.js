import ko from 'knockout';
import short from 'short-uuid';
import _ from 'lodash';

class BasePlayer {
    constructor(definition) {
        this.id = short().new();
        this.user = ko.observable(definition.user);
        this.cash = ko.observable(definition.cash || 0);
        this.worth = ko.observable(definition.worth || 0);
        this.certificates = ko.observableArray(definition.certificates);
        this.certificatesById = ko.computed(() => {
            return _.groupBy(this.certificates(), 'companyId');
        });
        this.popoverParams = {
            content: '<div data-bind="template: { name: \'playerPopover\' }"></div>'
        };
        this.name = ko.computed(() => {
            const user = this.user();
            return user ? user.username : this.id;
        })
    }

    addCash(amount) {
        this.cash(this.cash() + amount);
    }

    removeCash(amount) {
        this.cash(this.cash() - amount);
    }
}

export default BasePlayer;