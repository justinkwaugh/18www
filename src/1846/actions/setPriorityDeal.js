import Action from 'common/game/action';

class SetPriorityDeal extends Action {

    constructor(args) {
        super(args);
        this.playerIndex = args.playerIndex;
        this.oldPlayerIndex = args.oldPlayerIndex;
    }

    doExecute(state) {
        this.oldPlayerIndex = state.priorityDealIndex();
        state.priorityDealIndex(this.playerIndex);
    }

    doUndo(state) {
        state.priorityDealIndex(this.oldPlayerIndex);
    }

    summary(state) {
        return this.playerIndex + ' has priority deal'
    }
}

SetPriorityDeal.registerClass();

export default SetPriorityDeal