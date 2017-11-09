
class Token {
    constructor(data) {
        data = data || {};

        this.id = data.id;
        this.name = data.name;
        this.companyId = data.companyId;
    }
}

export default Token;