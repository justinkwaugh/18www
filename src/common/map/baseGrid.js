import ko from 'knockout';
import _ from 'lodash';

class BaseGrid {
    constructor(data) {
        this.cellSize = data.cellSize;
        this.cells = ko.observableArray(data.cells);
        this.cellsById = ko.computed(()=> {
            return _.keyBy(this.cells(), 'id');
        })
    }

}

export default BaseGrid;