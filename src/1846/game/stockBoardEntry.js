import ko from 'knockout';
import _ from 'lodash';
import Serializable from 'common/model/serializable';
class StockBoardEntry extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super();

        this.value = definition.value;
        this.companies = ko.observableArray(definition.companies || []);
    }

    toJSON() {
        const plainObject = super.toJSON();
        plainObject.companies = this.companies();
        return plainObject;
    }
}

StockBoardEntry.registerClass();

export default StockBoardEntry;