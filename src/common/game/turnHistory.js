import _ from 'lodash';
import ko from 'knockout';
import Turn from 'common/game/turn';

class TurnHistory {
    constructor(state, definition) {
        definition = definition || {};
        this.state = state;
        this.turns = ko.observableArray(definition.turns || []);
        this.currentTurn = ko.observable(definition.currentTurn);
    }

    startTurn() {
        this.currentTurn(new Turn(this.state, {
            number: this.nextTurnNumber()
        }));
    }

    rollbackTurn() {
        if (this.currentTurn()) {
            this.currentTurn().undo();
        }
    }

    rollbackCurrentAction() {
        this.currentTurn().rollbackActionGroup();
    }

    commitTurn() {
        this.currentTurn().actionEndIndex = this.state.actionHistory.currentIndex();
        this.turns.push(this.currentTurn());
        this.currentTurn(null);
    }

    undoLastTurn() {
        const turn = this.turns.pop();
        turn.undo();
    }

    getCurrentTurn() {
        return this.currentTurn();
    }

    lastTurn() {
        return _.last(this.turns());
    }

    nextTurnNumber() {
        return this.turns().length + 1;
    }

}

export default TurnHistory;