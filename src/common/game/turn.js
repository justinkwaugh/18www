import ActionGroup from 'common/game/actionGroup';
import CurrentGame from 'common/game/currentGame';
import _ from 'lodash';

class Turn extends ActionGroup {

    constructor(definition) {
        definition.type = 'turn';
        super(definition);

        const state = CurrentGame().state();

        this.number = definition.number;
        this.playerId = definition.playerId || state.currentPlayerId();
        this.phaseId = definition.phaseId || state.currentPhaseId();
        this.roundId = definition.roundId || state.currentRoundId();
        this.roundNumber = definition.roundNumber || state.currentRoundNumber();
        this.actionGroups = [];
        this.inProgress = [];
        this.actionStartIndex = state.actionHistory.currentIndex();
        this.context = definition.context || {};
    }

    undo() {
        CurrentGame().state().actionHistory.undoRange(this.actionStartIndex, this.actionEndIndex);
    }

    undoLast() {
        CurrentGame().state().actionHistory.undo();
    }

    commitActionGroup(type) {
        const last = _.last(this.inProgress);
        if (!last || last.type !== type) {
            throw Error('Tried to commit ' + type + ' that was not in progress');
        }
        console.log('Committing ' + type + ' ' + last.id);
        const actionGroup = this.inProgress.pop();
        actionGroup.actionEndIndex = CurrentGame().state().actionHistory.currentIndex();
        this.actionGroups.push(actionGroup);
    }

    rollbackPrior(type) {
        const prior = this.actionGroups.pop();
        if (!prior || prior.type !== type) {
            throw Error('Tried to rollback prior ' + type + ', but none found');
        }
        console.log('Rolling back ' + prior.type + ' ' + prior.id);
        CurrentGame().state().actionHistory.undoRange(prior.actionStartIndex);
    }

    rollbackActionGroup(type) {
        const last = _.last(this.inProgress);
        if (!last || (type && last.type !== type)) {
            throw Error('Tried to rollback ' + type + ' that was not in progress');
        }
        console.log('Rolling back ' + last.type + ' ' + last.id);
        const actionGroup = this.inProgress.pop();
        CurrentGame().state().actionHistory.undoRange(actionGroup.actionStartIndex);
    }

    startActionGroup(id, type) {
        const current = _.last(this.inProgress);
        if(current && current.id === id && current.type === type) {
            return;
        }
        console.log('Starting ' + type + ' ' + id);
        const actionGroup = new ActionGroup({
            type: type,
            id: id,
            actionStartIndex: CurrentGame().state().actionHistory.currentIndex()
        });
        this.inProgress.push(actionGroup);
    }

    getSummaries() {
        if (this.actionEndIndex <= this.actionStartIndex) {
            return [];
        }

        return _(
            CurrentGame().state().actionHistory.getActionRange(this.actionStartIndex, this.actionEndIndex))
            .invokeMap('summary', CurrentGame().state()).map(
                (summary, index) => {
                        return {
                            index: this.actionStartIndex + index,
                            type: 'action',
                            summary
                        }
                }).value();
    }

    getInstructions() {
        if (this.actionEndIndex <= this.actionStartIndex) {
            return [];
        }

        return _(
            CurrentGame().state().actionHistory.getActionRange(this.actionStartIndex, this.actionEndIndex))
            .invokeMap('instructions', CurrentGame().state()).map(
                (instructions, index) => {
                    return _.map(instructions, (instruction) => {
                        return {
                            index: this.actionStartIndex + index,
                            type: 'action',
                            instruction
                        }
                    });
                }).flatten().value();
    }

}

Turn.registerClass();

export default Turn;