import ko from 'knockout';
import Serializable from 'common/model/serializable';
class StockBoardEntry extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super();

        this.value = definition.value;
        this.companies = ko.observableArray(definition.companies || []);
    }
}

StockBoardEntry.registerClass();

export default StockBoardEntry;