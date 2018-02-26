import Action from 'common/game/action';
import _ from 'lodash';

class UpdateSequence extends Action {

    constructor(args) {
        super(args);
        this.companyId = args.companyId;
        this.playerIndex = args.playerIndex;
        this.firstPassIndex = args.firstPassIndex;
        this.winner = args.winner;
        this.oldCompanyId = args.oldCompanyId;
        this.oldPlayerIndex = args.oldPlayerIndex;
        this.oldFirstPassIndex = args.oldFirstPassIndex;
    }

    doExecute(state) {
        if (!_.isUndefined(this.companyId)) {
            this.oldCompanyId = state.currentCompanyId();
            state.currentCompanyId(this.companyId);
        }

        if (!_.isUndefined(this.playerIndex)) {
            this.oldPlayerIndex = state.currentPlayerIndex();
            state.currentPlayerIndex(this.playerIndex);
        }

        if (!_.isUndefined(this.firstPassIndex)) {
            this.oldFirstPassIndex = state.firstPassIndex();
            state.firstPassIndex(this.firstPassIndex);
        }

        if(this.winner) {
            state.winner(this.winner);
        }
    }

    doUndo(state) {
        if (!_.isUndefined(this.companyId)) {
            state.currentCompanyId(this.oldCompanyId);
        }

        if (!_.isUndefined(this.playerIndex)) {
            state.currentPlayerIndex(this.oldPlayerIndex);
        }

        if (!_.isUndefined(this.firstPassIndex)) {
            state.firstPassIndex(this.oldFirstPassIndex);
        }

        if(this.winner) {
            state.winner(null);
        }
    }

    summary(state) {
        return '';
    }

    confirmation(state) {
        return '';
    }
}

UpdateSequence.registerClass();

export default UpdateSequence