import _ from 'lodash';
import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';
import Serializable from 'common/model/serializable';

class ActionHistory extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super();

        this.actions = ko.observableArray(definition.actions || []);
        this.lastCommittedIndex = ko.observable(definition.lastCommittedIndex || 0);
    }

    addAction(action) {
        this.actions.push(action);
    }

    canUndo() {
        return this.currentIndex() > this.lastCommittedIndex();
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

    commit() {
        this.lastCommittedIndex(this.currentIndex());
    }
}

ActionHistory.registerClass();

export default ActionHistory;