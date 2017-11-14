import Action from 'common/game/action';
import _ from 'lodash';

class DraftPass extends Action {

    constructor(args) {
        super(args);

        this.playerId = args.playerId;
        this.privateId = args.privateId;
    }

    doExecute(state) {
        const privateCompany = state.privateCompaniesById[this.privateId];
        privateCompany.cost -= 10;
    }

    doUndo(state) {

    }

    instructions(state) {
        return ['Player ' + this.playerId + ' passed on ' + this.privateId];
    }

}

export default DraftPass