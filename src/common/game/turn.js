import ActionGroup from 'common/game/actionGroup';
import CurrentGame from 'common/game/currentGame';
import _ from 'lodash';
import ko from 'knockout';

class Turn extends ActionGroup {

    constructor(definition) {
        definition.type = 'turn';
        super(definition);

        const state = definition.state;

        this.number = definition.number;
        this.playerId = definition.playerId || state.currentPlayerId();
        this.actionGroups = definition.actionGroups || [];
        this.inProgress = ko.observableArray(definition.inProgress || []);
        this.actionStartIndex = _.isUndefined(definition.actionStartIndex) ? state.actionHistory.currentIndex() : definition.actionStartIndex;
        this.context = definition.context || {};
    }

    undoLast() {
        CurrentGame().state().actionHistory.undo();
    }

    commitActionGroup() {
        console.log('Committing ' + _.last(this.inProgress()).type );
        const actionGroup = this.inProgress.pop();
        actionGroup.actionEndIndex = CurrentGame().state().actionHistory.currentIndex();
        this.actionGroups.push(actionGroup);
    }

    rollbackPrior() {
        const prior = this.actionGroups.pop();
        console.log('Rolling back ' + prior.type);
        CurrentGame().state().actionHistory.undoRange(prior.actionStartIndex);
    }

    rollbackActionGroup() {
        console.log('Rolling back ' + last.type);
        const actionGroup = this.inProgress.pop();
        CurrentGame().state().actionHistory.undoRange(actionGroup.actionStartIndex);
    }

    startActionGroup(type) {
        console.log('Starting group ' + type );
        const actionGroup = new ActionGroup({
            type: type,
            actionStartIndex: CurrentGame().state().actionHistory.currentIndex()
        });
        this.inProgress.push(actionGroup);
    }

    getCurrentSummaries() {
        const inProgress = _.last(this.inProgress());
        return inProgress ? inProgress.getSummaries() : this.getSummaries();
    }

}

Turn.registerClass();

export default Turn;