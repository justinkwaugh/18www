import Action from 'common/game/action';
import _ from 'lodash';

class DraftPrivate extends Action {

    constructor(args) {
        super(args);

        this.playerId = args.playerId;
        this.privateId = args.privateId;
        this.offeredIds = args.offeredIds;
    }

    doExecute(state) {
        const player = state.playersById()[this.playerId];
        const privateCompany = state.privateCompaniesById[this.privateId];
        if (!_.startsWith(this.privateId, 'pass')) {
            player.cash(player.cash() - privateCompany.cost);
            player.certificates.push(privateCompany.certificates.pop());
        }
        state.undraftedPrivateIds.removeAll(this.offeredIds);
        state.undraftedPrivateIds.push.apply(state.undraftedPrivateIds,
                                             _.shuffle(_.without(this.offeredIds, this.privateId)));
    }

    doUndo(state) {

    }

    instructions(state) {
        return ['Player ' + this.playerId + ' drafted ' + this.privateId];
    }

}

export default DraftPrivate