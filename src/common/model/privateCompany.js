import Company from 'common/model/company';
import CompanyTypes from 'common/model/companyTypes';
import ko from 'knockout';

class PrivateCompany extends Company {
    constructor(definition) {
        definition = definition || {};
        super(definition);

        this.cost = definition.cost || 0;
        this.maxBuyInPrice = definition.maxBuyInPrice || 0;
        this.income = definition.income || 0;
        this.hasAbility = definition.hasAbility;
        this.used = ko.observable(definition.used || false);
    }
}

PrivateCompany.registerClass();

export default PrivateCompany;