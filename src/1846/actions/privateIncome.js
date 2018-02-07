import Action from 'common/game/action';
import _ from 'lodash';

class PrivateIncome extends Action {

    constructor(args) {
        super(args);
    }

    doExecute(state) {
        _.each(state.players(), player=> {
            const cash = _.sumBy(player.getPrivates(), privateCo=>privateCo.income);
            player.addCash(cash);
        });
        _.each(state.publicCompanies, company=> {
            const cash = _.sumBy(company.getPrivates(), privateCo=>privateCo.income);
            company.addCash(cash);
        });
    }

    doUndo(state) {
        _.each(state.players(), player=> {
            const cash = _.sumBy(player.getPrivates(), privateCo=>privateCo.income);
            player.removeCash(cash);
        });
        _.each(state.publicCompanies, company=> {
            const cash = _.sumBy(company.getPrivates(), privateCo=>privateCo.income);
            company.removeCash(cash);
        });
    }

    summary(state) {
        return 'Private income paid';
    }
}

PrivateIncome.registerClass();

export default PrivateIncome