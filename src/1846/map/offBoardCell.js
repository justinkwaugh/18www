import Cell from 'common/map/cell';
import _ from 'lodash';

class OffBoardCell extends Cell {
    constructor(definition) {
        definition = definition || {};
        super(definition);
        this.offboard = true;
        this.connectionsToNeighborIndex = definition.connectionsToNeighborIndex || {};
        this.direction = definition.direction;
        this.ewBonus = definition.bonus;
    }

    getConnectionPointAtIndex(neighbor, index) {
        const neighborConnectionId = neighbor.id + '|' + index;
        const point = this.connectionsToNeighborIndex[neighborConnectionId];

        return _.isNumber(point) ? point : -1;
    }
    //
    // hasConnectionAtIndex(index) {
    //     return _.indexOf(this.connections, index) >= 0;
    // }

}

export default OffBoardCell;