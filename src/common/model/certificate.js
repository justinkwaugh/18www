import short from 'short-uuid';
import Serializable from 'common/model/serializable';

class Certificate extends Serializable {
    constructor(definition) {
        super();
        definition = definition || {};
        this.id = definition.id || short().new();
        this.companyId = definition.companyId;
        this.shares = definition.shares;
        this.president = definition.president;
    }
}

Certificate.registerClass();

export default Certificate;