import ko from 'knockout';
import _ from 'lodash';
import CurrentGame from 'common/game/currentGame';
import Sequence from '1846/game/sequence';
import IssueShares from '1846/actions/issueShares';
import RedeemShares from '1846/actions/redeemShares';
import Prices from '1846/config/prices';

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
        this.selectedPrivateId = ko.observable(definition.selectedPrivateId);
        this.numberOfShares = ko.observable(definition.numberOfShares || 0);
        this.action = ko.computed(() => {
            return false;
        });
        
        this.canBuyPrivates = ko.computed(()=> {
            if (!CurrentGame() || !CurrentGame().state().currentCompany() || !CurrentGame().state().currentPlayer()) {
                return false;
            }
            
            return CurrentGame().state().currentPlayer().getPrivates().length > 0 && CurrentGame().state().currentCompany().cash() > 0;
        });

        this.canIssue = ko.computed(()=> {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            return !this.hasLaidTrackOrTokenedThisTurn() && !this.hasIssuedThisTurn() && !this.hasRedeemedThisTurn() && this.getNumCanIssue() > 0;
        });

        this.canRedeem = ko.computed(()=> {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            return !this.hasLaidTrackOrTokenedThisTurn() && !this.hasRedeemedThisTurn() && !this.hasIssuedThisTurn() && this.getNumCanRedeem() > 0;
        });

        this.canLayTrackOrToken = ko.computed(()=> {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            const company = CurrentGame().state().currentCompany();
            return company.cash() >= 20;
            // IC free spots
        });

        this.action = ko.computed(() => {
            if (this.selectedAction() === Actions.ISSUE_SHARES && this.numberOfShares()) {
                return new IssueShares({
                                           companyId: CurrentGame().state().currentCompanyId(),
                                           count: this.numberOfShares()
                                       });
            }
            else if (this.selectedAction() === Actions.REDEEM_SHARES && this.numberOfShares()) {
                return new RedeemShares({
                                           companyId: CurrentGame().state().currentCompanyId(),
                                           count: this.numberOfShares()
                                       });
            }
        });

    }

    getNumCanRedeem() {
        const company = CurrentGame().state().currentCompany();
        const sharesAvailable = CurrentGame().state().bank.numSharesOwnedOfCompany(company.id);
        const cost = Prices.rightPrice(company.priceIndex());
        return Math.min(sharesAvailable, Math.floor(company.cash() / cost));
    }

    hasRedeemedThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'RedeemShares';
        });
    }

    getNumCanIssue() {
        const company = CurrentGame().state().currentCompany();
        return Math.min(company.shares(),10-company.shares()-CurrentGame().state().bank.numSharesOwnedOfCompany(company.id));
    }

    hasIssuedThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'IssueShares';
        });
    }

    hasLaidTrackOrTokenedThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'LayTrack' || action.getTypeName() === 'AddToken';
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

    selectPrivate(companyId) {
        this.selectedPrivateId(companyId);

    }
    reset() {
        this.selectedAction(null);
        this.numberOfShares(0);
        this.selectedPrivateId(null);
    }

    commit() {
        this.action().execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.reset();
    }
}

export default OperatingRound;