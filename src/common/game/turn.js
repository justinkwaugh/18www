import ActionGroup from 'common/game/actionGroup';
import _ from 'lodash';

class Turn extends ActionGroup {

    constructor(state, definition) {
        definition.type = 'turn';
        super(definition);
        this.state = state;
        this.number = definition.number;
        this.playerId = definition.playerId;
        this.phaseId = definition.phaseId;
        this.roundId = definition.roundId;
        this.roundNumber = definition.roundNumber;
        this.actionGroups = [];
        this.inProgress = [];
    }

    undo() {
        this.state.actionHistory.undoRange(this.actionStartIndex, this.actionEndIndex);
    }

    commitActionGroup(type) {
        const last = _.last(this.inProgress);
        if (!last || last.type !== type) {
            throw Error('Tried to commit ' + type + ' that was not in progress');
        }
        console.log('Committing ' + type + ' ' + last.id);
        const actionGroup = this.inProgress.pop();
        actionGroup.actionEndIndex = this.state.actionHistory.currentIndex();
        this.actionGroups.push(actionGroup);
    }

    rollbackPrior(type) {
        const prior = this.actionGroups.pop();
        if (!prior || prior.type !== type) {
            throw Error('Tried to rollback prior ' + type + ', but none found');
        }
        console.log('Rolling back ' + prior.type + ' ' + prior.id);
        this.state.actionHistory.undoRange(prior.actionStartIndex);
    }

    rollbackActionGroup(type) {
        const last = _.last(this.inProgress);
        if (!last || (type && last.type !== type)) {
            throw Error('Tried to rollback ' + type + ' that was not in progress');
        }
        console.log('Rolling back ' + last.type + ' ' + last.id);
        const actionGroup = this.inProgress.pop();
        this.state.actionHistory.undoRange(actionGroup.actionStartIndex);
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
            actionStartIndex: this.state.actionHistory.currentIndex()
        });
        this.inProgress.push(actionGroup);
    }

    getInstructions(state) {
        if (this.actionEndIndex <= this.actionStartIndex) {
            return [];
        }

        return _(
            state.actionHistory.getActionRange(this.actionStartIndex, this.actionEndIndex))
            .invokeMap('instructions', state).map(
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

export default Turn;