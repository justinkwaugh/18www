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
import BuyTrains from '1846/actions/buyTrains';
import Events from 'common/util/events';
import TrainDefinitions from '1846/config/trainDefinitions';
import CompanyTypes from 'common/model/companyTypes';

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
        this.selectedTrainSource = ko.observable(definition.selectedTrainSource);
        this.selectedCompanyTrainsForPurchase = ko.observableArray(definition.selectedCompanyTrainsForPurchase);
        this.selectedBankTrainsForPurchase = ko.observable(definition.selectedBankTrainsForPurchase || {});
        this.maxPrivateCost = ko.computed(() => {
            if (!this.selectedPrivateId()) {
                return 1;
            }
            const privateCompany = CurrentGame().state().getCompany(this.selectedPrivateId());
            return Math.min(privateCompany.maxBuyInPrice, CurrentGame().state().currentCompany().cash());
        });
        this.privatePrice = ko.observable().extend({numeric: this.maxPrivateCost});

        this.maxCompanyTrainPurchasePrice = ko.computed(() => {
            if (this.selectedCompanyTrainsForPurchase().length <= 0) {
                return 1;
            }
            return CurrentGame().state().currentCompany().cash();
        });
        this.companyTrainPurchasePrice = ko.observable().extend({numeric: this.maxCompanyTrainPurchasePrice});

        this.numberOfShares = ko.observable(definition.numberOfShares || 0);
        this.useablePrivates = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return [];
            }
            return _(CurrentGame().state().currentCompany().getPrivates()).filter(
                privateCompany => privateCompany.hasAbility && !privateCompany.used()).value();
        });

        this.useablePrivates.subscribe((value) => {
            if (value.length === 0 && this.selectedPrivateId()) {
                this.reset();
            }
        });

        this.runRevenue = ko.computed(() => {
            if (!this.selectedTrain()) {
                return 0;
            }

            return _.sumBy(this.companyTrains(), train => train.route.revenue());
        });

        this.halfPayResult = ko.computed(() => {
            if (!this.selectedTrain()) {
                return 0;
            }
            const halfRevenue = this.runRevenue() / 2;
            const remainder = halfRevenue % 10;
            const payout = halfRevenue + remainder;
            return this.calculateStockMovementDisplay(this.calculateStockMovement(payout));
        });

        this.fullPayResult = ko.computed(() => {
            if (!this.selectedTrain()) {
                return 0;
            }
            const revenue = this.runRevenue();
            return this.calculateStockMovementDisplay(this.calculateStockMovement(revenue));
        });

        this.numAvailableBankTrains = ko.computed(() => {
            if (this.selectedTrainSource() !== 'bank') {
                return 0;
            }
            const state = CurrentGame().state();
            const currentPhase = state.currentPhaseId();
            return state.bank.trainsByPhase()[currentPhase] || state.bank.trainsByPhase()[state.getNextPhase()];
        });

        this.availableBankTrains = ko.computed(() => {
            if (this.selectedTrainSource() !== 'bank') {
                return [];
            }
            const state = CurrentGame().state();

            const companyCash = state.currentCompany().cash();
            const currentPhase = state.currentPhaseId();

            const numTrains = state.bank.trainsByPhase()[currentPhase];
            const trainPhase = numTrains ? currentPhase : state.getNextPhase();
            const availableTrains = state.bank.getTrainsForPhase(trainPhase);
            const numAvailable = state.bank.trainsByPhase()[trainPhase];
            const numCanBuy = state.trainLimit() - state.currentCompany().trains().length;

            return _.map(availableTrains, trainType=> {
                const trainDefinition = TrainDefinitions[trainType];
                return {
                    type: trainType,
                    cost: trainDefinition.cost,
                    num: _.min([numAvailable, numCanBuy, Math.floor(companyCash / trainDefinition.cost)]),
                    available: numAvailable
                }
            })
        });

        this.availableCompanyTrains = ko.computed(() => {
            if (!this.selectedTrainSource() || this.selectedTrainSource() === 'bank') {
                return [];
            }


            const company = CurrentGame().state().getCompany(this.selectedTrainSource());
            return company.trains();

        });

        this.canBuyPrivates = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany() || !CurrentGame().state().currentPlayer()) {
                return false;
            }

            if (CurrentGame().state().currentCompany().type !== CompanyTypes.PUBLIC) {
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

            if (CurrentGame().state().currentCompany().type !== CompanyTypes.PUBLIC) {
                return false;
            }

            return !this.hasRunRoutesThisTurn() && !this.hasLaidTrackOrTokenedThisTurn() && !this.hasIssuedThisTurn() && !this.hasRedeemedThisTurn() && this.getNumCanIssue() > 0;
        });

        this.canRedeem = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            if (CurrentGame().state().currentCompany().type !== CompanyTypes.PUBLIC) {
                return false;
            }

            return !this.hasRunRoutesThisTurn() && !this.hasLaidTrackOrTokenedThisTurn() && !this.hasRedeemedThisTurn() && !this.hasIssuedThisTurn() && this.getNumCanRedeem() > 0;
        });

        this.canLayTrackOrToken = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            if (this.hasRunRoutesThisTurn()) {
                return false;
            }

            const company = CurrentGame().state().currentCompany();
            return company.cash() >= 20;
            // IC free spots
        });

        this.canRunRoutes = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            if (this.hasRunRoutesThisTurn()) {
                return false;
            }

            return true;
        });

        this.canBuyTrains = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return false;
            }

            if (CurrentGame().state().currentCompany().type !== CompanyTypes.PUBLIC) {
                return false;
            }

            if (!this.hasRunRoutesThisTurn()) {
                return false;
            }

            if (CurrentGame().state().currentCompany().trains().length >= CurrentGame().state().trainLimit()) {
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
            else if (this.selectedAction() === Actions.BUY_TRAINS && this.selectedTrainSource() && this.selectedTrainSource() !== 'bank' && this.selectedCompanyTrainsForPurchase().length > 0 && this.companyTrainPurchasePrice()) {
                // return new BuyTrains({
                //                           playerId: CurrentGame().state().currentPlayerId(),
                //                           companyId: CurrentGame().state().currentCompanyId(),
                //                           sourceId: this.selectedTrainSource(),
                //                           trains: this.selectedCompanyTrainsForPurchase(),
                //                           cost: this.companyTrainPurchasePrice()
                //                       });
            }
            else if (this.selectedAction() === Actions.BUY_TRAINS && this.selectedTrainSource() === 'bank' && _.keys(this.selectedBankTrainsForPurchase()).length > 0) {
                return new BuyTrains({
                                          companyId: CurrentGame().state().currentCompanyId(),
                                          trains: this.selectedBankTrainsForPurchase(),
                                          source: this.selectedTrainSource()
                                      });
            }
        });

        Events.on('undo', () => {
            if (CurrentGame().state().isOperatingRound()) {
                this.reset();
            }
        });

        Events.on('turnEnd', () => {
            this.reset();
        });
    }

    calculateStockMovement(revenue) {
        const currentPrice = CurrentGame().state().currentCompany().price();

        if (revenue < currentPrice) {
            return 0;
        }
        else if (revenue < currentPrice * 2) {
            return 1;
        }
        else if (revenue < currentPrice * 3) {
            return 2;
        }
        else if (currentPrice >= 165) {
            return 3;
        }
    }

    calculateStockMovementDisplay(movement) {
        if (movement === 0) {
            return 'no change';
        }
        else if (movement === 1) {
            return 'price \u21E2';
        }
        else if (movement === 2) {
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

    getCompaniesWithTrains() {

        return _(CurrentGame().state().currentPlayer().presidentCompanyIds()).reject(
            companyId => companyId === CurrentGame().state().currentCompany().id).map(
            companyId => CurrentGame().state().getCompany(companyId)).filter(
            company => company.trains().length > 0).value();
    }

    canAllocateRevenue() {
        return CurrentGame().state().currentCompany().type !== CompanyTypes.INDEPENDANT;
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
        if (this.selectedAction() === Actions.BUY_PRIVATES) {

        }
        else if (this.selectedAction() === Actions.USE_PRIVATES) {
            if (this.useablePrivates().length === 1) {
                this.selectPrivate(this.useablePrivates()[0].id);
            }
        }
        else if (this.selectedAction() === Actions.RUN_ROUTES) {
            const company = CurrentGame().state().currentCompany();
            this.companyTrains(_.map(company.trains(), train => train.clone()));
            Events.emit('drawRoutes', _.map(this.companyTrains(), train => train.route));

            if (this.companyTrains().length === 0) {
                this.selectedAllocation(Allocations.FULL);
            }
            else {
                this.selectTrain(_.first(this.companyTrains()));
            }

            if(company.type === CompanyTypes.INDEPENDANT) {
                this.selectedAllocation(Allocations.HALF);
            }

        }
        else if (this.selectedAction() === Actions.BUY_TRAINS) {
            if (this.getCompaniesWithTrains().length === 0) {
                this.selectedTrainSource('bank');
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

    selectCompanyTrainForPurchase(selectedTrain) {
        const selectingTrain = !_.find(this.selectedCompanyTrainsForPurchase(), train => train.id === selectedTrain.id);
        if (selectingTrain) {
            const numTrainsOwned = CurrentGame().state().currentCompany().trains().length;
            const trainLimit = CurrentGame().state().trainLimit();
            const numSelected = this.selectedCompanyTrainsForPurchase().length;
            const numLeft = trainLimit - (numSelected + numTrainsOwned);
            if (numLeft > 0) {
                this.selectedCompanyTrainsForPurchase.push(selectedTrain);
            }
        }
        else {
            this.selectedCompanyTrainsForPurchase.remove(train => train.id === selectedTrain.id)
        }
    }

    isCompanyTrainSelectedForPurchase(id) {
        return _.find(this.selectedCompanyTrainsForPurchase(), train => train.id === id);
    }

    selectBankTrainForPurchase(trainType, amount) {
        this.selectedBankTrainsForPurchase.valueWillMutate();
        if(this.selectedBankTrainsForPurchase()[trainType] === amount) {
            delete this.selectedBankTrainsForPurchase()[trainType];
        }
        else {
            this.selectedBankTrainsForPurchase()[trainType] = amount;
        }
        this.selectedBankTrainsForPurchase.valueHasMutated();
    }

    isBankTrainSelectedForPurchase(trainType, amount) {
        return this.selectedBankTrainsForPurchase()[trainType] === amount;
    }


    reset() {
        this.selectedAction(null);
        this.numberOfShares(0);
        this.selectedPrivateId(null);
        this.privatePrice(null);
        this.selectedAllocation(null);
        this.selectedTrain(null);
        this.selectedTrainSource(null);
        this.selectedBankTrainsForPurchase({});
        Events.emit('clearRoutes');
    }

    commit() {
        this.action().execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.reset();
    }
}

export default OperatingRound;