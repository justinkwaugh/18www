import short from 'short-uuid';

class Certificate {
    constructor(definition) {
        definition = definition || {};
        this.id = definition.id || short().new();
        this.companyId = definition.companyId;
        this.shares = definition.shares;
        this.president = definition.president;
    }
}

export default Certificate;