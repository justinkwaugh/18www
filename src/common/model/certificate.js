class Certificate {
    constructor(definition) {
        definition = definition || {};
        this.companyId = definition.companyId;
        this.shares = definition.shares;
        this.president = definition.president;
    }
}

export default Certificate;