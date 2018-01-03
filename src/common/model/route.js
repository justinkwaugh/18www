import short from 'short-uuid';
import Serializable from 'common/model/serializable';

class Route extends Serializable {
    constructor(definition) {
        super();
        definition = definition || {};
        this.color = definition.color || 'red';
        this.cells = definition.cells || [];
    }
}

Route.registerClass();

export default Route;