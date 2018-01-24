import ko from 'knockout';
import _ from 'lodash';
import CurrentGame from 'common/game/currentGame';
import Sequence from '1846/game/sequence';
import CompanyIDs from '1846/config/companyIds';
import IssueShares from '1846/actions/issueShares';
import RedeemShares from '1846/actions/redeemShares';
import BuyPrivate from '1846/actions/buyPrivate';
import Prices from '1846/config/prices';
import Allocations from '1846/config/allocations';
import RunRoutes from '1846/actions/runRoutes';
import Events from 'common/util/events';

const Actions = {
    ISSUE_SHARES: 'issue',
    REDEEM_SHARES: 'redeem',
    BUY_PRIVATES: 'buy_privates',
    LAY_TRACK: 'lay_track',
    RUN_ROUTES: 'run_routes',
    BUY_TRAINS: 'buy_trains',
    USE_PRIVATES: 'use_privates',
    // Private actions
    // O&I = Lay 2 tiles
    // MC = Lay 2 tiles
    // LSL = Upgrade tile
    // MEAT = Place token
    // STEAMBOAT = Place token
    // C&WI = Place token
};

const PrivateActions = {
    OANDI: 'oandi',
    MC: 'mc',
    LSL: 'lsl',
    MEAT: 'meat',
    STEAMBOAT: 'boat',
    CWI: 'cwi'
};

class OperatingRound {
    constructor(definition) {
        definition = definition || {};

        this.Actions = Actions;
        this.PrivateActions = PrivateActions;
        this.Allocations = Allocations;

        this.selectedAction = ko.observable(definition.selectedAction);
        this.selectedPrivateId = ko.observable(definition.selectedPrivateId);
        this.companyTrains = ko.observableArray(definition.companyTrains);
        this.selectedTrain = ko.observable(definition.selectedTrain);
        this.selectedAllocation = ko.observable(definition.selectedAllocation);

        this.maxPrivateCost = ko.computed(() => {
            if (!this.selectedPrivateId()) {
                return 1;
            }
            const privateCompany = CurrentGame().state().getCompany(this.selectedPrivateId());
            return Math.min(privateCompany.maxBuyInPrice, CurrentGame().state().currentCompany().cash());
        });
        this.privatePrice = ko.observable().extend({numeric: this.maxPrivateCost});
        this.numberOfShares = ko.observable(definition.numberOfShares || 0);
        this.useablePrivates = ko.computed(()=> {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return [];
            }
           return _(CurrentGame().state().currentCompany().getPrivates()).filter(
                privateCompany => privateCompany.hasAbility && !privateCompany.used()).value();
        });

        this.useablePrivates.subscribe((value)=> {
            if(value.length === 0 && this.selectedPrivateId()) {
                this.reset();
            }
        });

        this.runRevenue = ko.computed(()=> {
            if(!this.selectedTrain()) {
                return 0;
            }

            return _.sumBy(this.companyTrains(), train=>train.route.revenue());
        });

        this.halfPayResult = ko.computed(()=> {
            if(!this.selectedTrain()) {
                return 0;
            }
            const halfRevenue = this.runRevenue() / 2;
            const remainder = halfRevenue % 10;
            const payout = halfRevenue + remainder;
            return this.calculateStockMovementDisplay(this.calculateStockMovement(payout));
        });

        this.fullPayResult = ko.computed(()=> {
            if(!this.selectedTrain()) {
                return 0;
            }
            const revenue = this.runRevenue();
            return this.calculateStockMovementDisplay(this.calculateStockMovement(revenue));
        });

        this.action = ko.computed(() => {
            return false;
        });

        this.canBuyPrivates = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany() || !CurrentGame().state().currentPlayer()) {
                return false;
            }

            return CurrentGame().state().currentPlayer().getPrivates().length > 0 && CurrentGame().state().currentCompany().cash() > 0;
        });

        this.canUsePrivates = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            return this.useablePrivates().length > 0;
        });

        this.canIssue = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            return !this.hasRunRoutesThisTurn() && !this.hasLaidTrackOrTokenedThisTurn() && !this.hasIssuedThisTurn() && !this.hasRedeemedThisTurn() && this.getNumCanIssue() > 0;
        });

        this.canRedeem = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            return !this.hasRunRoutesThisTurn() && !this.hasLaidTrackOrTokenedThisTurn() && !this.hasRedeemedThisTurn() && !this.hasIssuedThisTurn() && this.getNumCanRedeem() > 0;
        });

        this.canLayTrackOrToken = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            if(this.hasRunRoutesThisTurn()) {
                return false;
            }

            const company = CurrentGame().state().currentCompany();
            return company.cash() >= 20;
            // IC free spots
        });

        this.canRunRoutes = ko.computed(()=> {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            if(this.hasRunRoutesThisTurn()) {
                return false;
            }

            return true;
        });

        this.canBuyTrains = ko.computed(()=> {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            if(!this.hasRunRoutesThisTurn()) {
                return false;
            }

            return true;
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
            else if (this.selectedAction() === Actions.BUY_PRIVATES && this.selectedPrivateId() && this.privatePrice()) {
                return new BuyPrivate({
                                          playerId: CurrentGame().state().currentPlayerId(),
                                          companyId: CurrentGame().state().currentCompanyId(),
                                          privateId: this.selectedPrivateId(),
                                          price: this.privatePrice()
                                      });
            }
            else if (this.selectedAction() === Actions.RUN_ROUTES && this.selectedAllocation()) {
                return new RunRoutes({
                                          playerId: CurrentGame().state().currentPlayerId(),
                                          companyId: CurrentGame().state().currentCompanyId(),
                                          revenue: this.runRevenue(),
                                          allocation: this.selectedAllocation(),
                                          trains: this.companyTrains()
                                      });
            }
        });

        Events.on('undo', ()=> {
            this.reset();
        });
    }

    calculateStockMovement(revenue) {
        const currentPrice = CurrentGame().state().currentCompany().price();

            if(revenue < currentPrice) {
                return 0;
            }
            else if(revenue < currentPrice*2) {
                return 1;
            }
            else if(revenue < currentPrice*3) {
                return 2;
            }
            else {
                return 3;
            }
    }

    calculateStockMovementDisplay(movement) {
        if (movement === 0) {
            return 'no change';
        }
        else if(movement === 1) {
            return 'price \u21E2';
        }
        else if(movement === 2) {
            return 'price \u21E2 2x';
        }
        else {
            return 'price \u21E2 3x';
        }
    }

    isOhioIndianaAbility() {
        return this.selectedAction() === Actions.USE_PRIVATES
               && this.selectedPrivateId() === CompanyIDs.OHIO_INDIANA;
    }

    isMichiganCentralAbility() {
        return this.selectedAction() === Actions.USE_PRIVATES
               && this.selectedPrivateId() === CompanyIDs.MICHIGAN_CENTRAL;
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
        return Math.min(company.shares(),
                        10 - company.shares() - CurrentGame().state().bank.numSharesOwnedOfCompany(company.id));
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

    hasRunRoutesThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'RunRoutes';
        });
    }

    hasPrivateLaidTrack() {
        if (this.isOhioIndianaAbility()) {
            const turn = CurrentGame().state().turnHistory.currentTurn();
            return _.find(turn.getActions(), action => {
                return action.getTypeName() === 'LayTrack' && action.privateId === CompanyIDs.OHIO_INDIANA;
            });
        }
    }

    selectAction(actionId) {
        this.reset();
        this.selectedAction(actionId);
        if(this.selectedAction() === Actions.BUY_PRIVATES) {

        }
        else if(this.selectedAction() === Actions.USE_PRIVATES) {
            if(this.useablePrivates().length === 1) {
                this.selectPrivate(this.useablePrivates()[0].id);
            }
        }
        else if(this.selectedAction() === Actions.RUN_ROUTES) {
            this.companyTrains(_.map(CurrentGame().state().currentCompany().trains(), train=> train.clone()));
            Events.emit('drawRoutes', _.map(this.companyTrains(), train=>train.route));

            if(this.companyTrains().length === 0) {
                this.selectedAllocation(Allocations.FULL);
            }
        }
    }

    selectPrivate(companyId) {
        this.selectedPrivateId(companyId);
        this.privatePrice(null);
    }

    selectTrain(train) {
        this.selectedTrain(train.id);
        CurrentGame().grid().route = train.route;
    }

    selectAllocation(allocation) {
        this.selectedAllocation(allocation);
    }

    reset() {
        this.selectedAction(null);
        this.numberOfShares(0);
        this.selectedPrivateId(null);
        this.privatePrice(null);
        this.selectedAllocation(null);
        this.selectedTrain(null);
        Events.emit('clearRoutes');
    }

    commit() {
        this.action().execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.reset();
    }
}

export default OperatingRound;