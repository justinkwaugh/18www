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

    summary(state) {
        const privateCompany = state.privateCompaniesById[this.privateId];
        return 'Passed on ' + privateCompany.name;
    }
}

DraftPass.registerClass();

export default DraftPass