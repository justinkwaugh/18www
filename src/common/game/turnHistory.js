import _ from 'lodash';
import Turn from 'common/game/turn';

class TurnHistory {
    constructor(state) {
        this.state = state;
        this.turns = [];
        this.currentTurn = null;
    }

    startTurn(playerId) {
        this.currentTurn = new Turn(this.state, {
            number: this.nextTurnNumber(),
            playerId: playerId,
            actionStartIndex: this.state.actionHistory.currentIndex()
        });
    }

    rollbackTurn() {
        if (this.currentTurn) {
            this.currentTurn.undo();
        }
    }

    rollbackCurrentAction() {
        this.currentTurn.rollbackActionGroup();
    }

    commitTurn(action) {
        this.currentTurn.commandAction = action;
        this.currentTurn.actionEndIndex = this.state.actionHistory.currentIndex();
        this.turns.push(this.currentTurn);
        this.currentTurn = null;
    }

    undoLastTurn() {
        const turn = this.turns.pop();
        turn.undo();
    }

    getCurrentTurn() {
        return this.currentTurn;
    }

    lastTurn() {
        return _.last(this.turns);
    }

    nextTurnNumber() {
        return this.turns.length + 1;
    }

}

export default TurnHistory;