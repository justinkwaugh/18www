import Action from 'common/game/action';
import _ from 'lodash';

class StockRoundPass extends Action {

    constructor(args) {
        super(args);
        this.playerIndex = args.playerIndex;
    }

    doExecute(state) {
        if(_.isNull(state.firstPassIndex()) || _.isUndefined(state.firstPassIndex())) {
            state.firstPassIndex(this.playerIndex);
        }
    }

    doUndo(state) {
        state.firstPassIndex(null);
    }

    summary(state) {
        return 'Passed';
    }

    confirmation(state) {
        return 'Confirm Pass';
    }
}

StockRoundPass.registerClass();

export default StockRoundPass