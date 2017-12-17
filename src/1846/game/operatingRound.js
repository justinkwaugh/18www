import ko from 'knockout';
import _ from 'lodash';
import CurrentGame from 'common/game/currentGame';
import Sequence from '1846/game/sequence';

const Actions = {
    ISSUE_SHARES: 'issue',
    REDEEM_SHARES: 'redeem',
    BUY_PRIVATES: 'buy_privates',
    LAY_TRACK: 'lay_track',
    RUN_ROUTES: 'run_routes',
    BUY_TRAINS: 'buy_trains'
    // Private actions
    // O&I = Lay 2 tiles
    // MC = Lay 2 tiles
    // LSL = Upgrade tile
    // MEAT = Place token
    // STEAMBOAT = Place token
    // C&WI = Place token
};

class OperatingRound {
    constructor(definition) {
        definition = definition || {};

        this.Actions = Actions;

        this.selectedAction = ko.observable(definition.selectedAction);
        this.action = ko.computed(() => {
            return false;
        });

    }

    selectAction(actionId) {
        this.reset();
        this.selectedAction(actionId);
        // if(this.selectedAction() === Actions.PASS) {
        //     this.commit();
        // }
        // else if(this.selectedAction() === Actions.SELL && _.values(CurrentGame().state().currentPlayer().sharesCanSell()).length ===1) {
        //     this.selectCompany(_.keys(CurrentGame().state().currentPlayer().sharesCanSell())[0]);
        // }
    }

    reset() {

    }

    commit() {
        this.action().execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.reset();
    }
}

export default OperatingRound;