import Company from 'common/model/company';
import CompanyTypes from 'common/model/companyTypes';

class PrivateCompany extends Company {
    constructor(definition) {
        definition = definition || {};
        definition.type = CompanyTypes.PRIVATE;
        super(definition);

        this.cost = definition.cost || 0;
        this.maxBuyInPrice = definition.maxBuyInPrice || 0;
        this.income = definition.income || 0;
    }
}

PrivateCompany.registerClass();

export default PrivateCompany;