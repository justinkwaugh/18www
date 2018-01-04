import short from 'short-uuid';
import Serializable from 'common/model/serializable';
import _ from 'lodash';
import ko from 'knockout';

class Route extends Serializable {
    constructor(definition) {
        super();
        definition = definition || {};
        this.color = definition.color || 'red';
        this.cells = ko.observableArray(definition.cells || []);
    }

    containsCell(id) {
        return _.indexOf(this.cells(), id) >= 0;
    }

    addCell(id) {
        if(!this.containsCell(id)) {
            this.cells.push(id);
        }
    }
}

Route.registerClass();

export default Route;