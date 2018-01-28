import Action from 'common/game/action';
import CompanyIDs from '1846/config/companyIds';
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
            state.bank.cash(state.bank.cash() + privateCompany.cost);
            player.certificates.push(privateCompany.certificates.pop());

            if(this.privateId === CompanyIDs.MICHIGAN_SOUTHERN || this.privateId === CompanyIDs.BIG_4) {
                privateCompany.president(this.playerId);
            }
        }
        state.undraftedPrivateIds.removeAll(this.offeredIds);
        state.undraftedPrivateIds.push.apply(state.undraftedPrivateIds,
                                             _.shuffle(_.without(this.offeredIds, this.privateId)));
    }

    doUndo(state) {

    }

    summary(state) {
        const privateCompany = state.privateCompaniesById[this.privateId];
        const passed = _.startsWith(this.privateId, 'pass');
        return 'Drafted ' + (passed ? this.privateId : privateCompany.name);
    }



}

DraftPrivate.registerClass();

export default DraftPrivate