import ko from 'knockout';

class PriceEntry {
    constructor(definition) {
        definition = definition || {};

        this.value = definition.value;
        this.companies = ko.observableArray(definition.companies || []);
    }
}

export default PriceEntry;