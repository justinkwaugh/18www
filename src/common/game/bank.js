import ko from 'knockout';
import _ from 'lodash';

class Bank {
    constructor(definition) {
        definition = definition || {};
        this.cash = ko.observable(definition.cash || 0);
        this.trainsByPhase = ko.observable(definition.trainsByPhase || {});
        this.certificates = ko.observableArray(definition.certificates || []);
        this.certsById = ko.computed(() => {
            return _.groupBy(this.certificates(), 'companyId');
        });
    }
}

export default Bank;