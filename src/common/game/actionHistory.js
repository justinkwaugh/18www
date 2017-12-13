import _ from 'lodash';
import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';
import Serializable from 'common/model/serializable';

class ActionHistory extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super();

        this.actions = ko.observableArray(definition.actions || []);
    }

    addAction(action) {
        this.actions.push(action);
    }

    undo() {
        const state = CurrentGame().state();
        const action = this.actions.pop();
        action.doUndo(state);
    }

    currentIndex() {
        return this.actions().length;
    }

    getActionRange(start, end) {
        return _.slice(this.actions(), start, end);
    }

    undoRange(start, end) {
        const actualEnd = end || this.actions().length;

        if (actualEnd <= start) {
            return [];
        }

        _.each(_.range(start,actualEnd), () => {
            this.undo();
        });
    }
}

ActionHistory.registerClass();

export default ActionHistory;