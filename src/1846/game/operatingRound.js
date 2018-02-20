import ko from 'knockout';
import _ from 'lodash';
import CurrentGame from 'common/game/currentGame';
import CompanyIDs from '1846/config/companyIds';
import IssueShares from '1846/actions/issueShares';
import RedeemShares from '1846/actions/redeemShares';
import BuyPrivate from '1846/actions/buyPrivate';
import Prices from '1846/config/prices';
import Allocations from '1846/config/allocations';
import RunRoutes from '1846/actions/runRoutes';
import BuyTrains from '1846/actions/buyTrains';
import SkipSecondPrivateLay from '1846/actions/skipSecondPrivateLay';
import Events from 'common/util/events';
import TrainDefinitions from '1846/config/trainDefinitions';
import CompanyTypes from 'common/model/companyTypes';
import DeclareBankruptcy from '1846/actions/declareBankruptcy';
import ForceIssueCloseCompany from '1846/actions/forceIssueCloseCompany';
import ReturnTrain from '1846/actions/returnTrain';
import PhaseIDs from '1846/config/phaseIds';

const Actions = {
    ISSUE_SHARES: 'issue',
    REDEEM_SHARES: 'redeem',
    BUY_PRIVATES: 'buy_privates',
    LAY_TRACK: 'lay_track',
    RUN_ROUTES: 'run_routes',
    BUY_TRAINS: 'buy_trains',
    USE_PRIVATES: 'use_privates',
    EMERGENCY_BUY: 'emergency_buy',
    BANKRUPT: 'bankrupt',
    CLOSE_COMPANY: 'close_company',
    RETURN_TRAIN: 'return_train',
    PLAYER_STEAMBOAT: 'player_steamboat'
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
        this.selectedForcedTrainForPurchase = ko.observable(definition.selectedForcedTrainForPurchase);
        this.selectedStocksForSale = ko.observable(definition.selectedStocksForSale || {});
        this.selectedTrainToReturn = ko.observable(definition.selectedTrainToReturn);
        this.selectedSteamboatCompany = ko.observable(definition.selectedSteamboatCompany);
        this.useCWIToken = ko.observable(definition.useCWIToken);

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
                privateCompany => {
                    if (!privateCompany.hasAbility || privateCompany.used() || privateCompany.closed()) {
                        return false;
                    }

                    if (privateCompany.id === CompanyIDs.STEAMBOAT_COMPANY && this.hasPlacedSteamboatThisTurn()) {
                        return false;
                    }

                    if (privateCompany.id === CompanyIDs.LAKE_SHORE_LINE && CurrentGame().state().currentPhaseId() === PhaseIDs.PHASE_I) {
                        return false;
                    }

                    return true;
                }).value();
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

            let revenue = _.sumBy(this.companyTrains(), train => train.route.revenue());
            const company = CurrentGame().state().currentCompany();
            if (company.hasPrivate(CompanyIDs.MAIL_CONTRACT)) {
                revenue += (_(this.companyTrains()).map(train => train.route.numStops()).max() || 0) * 10;
            }

            return revenue;
        });

        this.halfPayResult = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return '';
            }

            const halfRevenue = this.runRevenue() / 2;
            const remainder = halfRevenue % 10;
            const payout = halfRevenue + remainder;
            return this.calculateStockMovementDisplay(this.calculateStockMovement(payout));
        });

        this.fullPayResult = ko.computed(() => {
            if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
                return '';
            }

            const revenue = this.runRevenue();
            return this.calculateStockMovementDisplay(this.calculateStockMovement(revenue));
        });

        this.availableBankTrains = ko.computed(() => {
            if (this.selectedTrainSource() !== 'bank') {
                return [];
            }
            const state = CurrentGame().state();
            const company = state.currentCompany();
            const presidentless = !company.president();

            if (presidentless) {
                const cheapestTrain = this.getSingleCheapestTrain();
                if (company.cash() >= cheapestTrain.cost) {
                    return [cheapestTrain];
                }
                else {
                    return [];
                }
            }

            let numCanBuy = state.trainLimit() - (state.currentCompany().numTrainsForLimit() + this.numSelectedBankTrainsForPurchase());

            const cashAllocated = _.reduce(this.selectedBankTrainsForPurchase(), (sum, amount, type) => {
                const trainDefinition = TrainDefinitions[type];
                return sum + amount * trainDefinition.cost;
            }, 0);
            const cashAvailable = state.currentCompany().cash() - cashAllocated;

            const priorPhase = state.getPriorPhase();
            const currentPhase = state.currentPhaseId();
            const nextPhase = state.getNextPhase();

            const availablePhases = [];
            const numPriorAvailable = state.bank.getAvailableTrainsForPhase(priorPhase);
            if (priorPhase !== currentPhase && numPriorAvailable > 0) {
                availablePhases.push({phase: priorPhase, available: numPriorAvailable});
            }

            const numCurrentAvailable = state.bank.getAvailableTrainsForPhase(currentPhase);
            if (numCurrentAvailable > 0 || numCurrentAvailable === -1) {
                availablePhases.push({phase: currentPhase, available: numCurrentAvailable});
            }

            if (nextPhase !== currentPhase) {
                const numNextAvailable = state.bank.getAvailableTrainsForPhase(nextPhase);
                availablePhases.push({phase: nextPhase, available: numNextAvailable});
            }

            return _(availablePhases).map(phaseData => {
                return _.map(state.bank.getTrainsForPhase(phaseData.phase), trainType => {
                    return {phase: phaseData.phase, trainType, available: phaseData.available};
                });
            }).flatten().map(trainTypeData => {
                const trainDefinition = TrainDefinitions[trainTypeData.trainType];
                const numOfTypeSelected = this.selectedBankTrainsForPurchase()[trainTypeData.trainType] || 0;
                const numOfPhaseSelected = this.numSelectedBankTrainsForPhaseForPurchase(trainTypeData.phase);
                const numAffordable = Math.floor(
                    (cashAvailable + (numOfTypeSelected * trainDefinition.cost)) / trainDefinition.cost);
                const numAllowed = numCanBuy + numOfTypeSelected;
                const currentPhaseFullySelected = (numCurrentAvailable - this.numSelectedBankTrainsForPhaseForPurchase(
                        currentPhase)) <= 0;
                const phaseAllowed = availablePhases.length === 1 || trainTypeData.phase !== nextPhase || numCurrentAvailable === 0 || currentPhaseFullySelected;
                const numAvailable = phaseAllowed ? (trainTypeData.available - numOfPhaseSelected) + numOfTypeSelected : 0;
                return {
                    type: trainDefinition.id,
                    cost: trainDefinition.cost,
                    num: _.min([numAvailable, numAllowed, numAffordable]),
                    available: trainTypeData.available - numOfPhaseSelected
                }
            }).value();
        });

        this.sharesForSale = ko.computed(() => {
            if (!this.selectedForcedTrainForPurchase()) {
                return [];
            }
            const company = CurrentGame().state().currentCompany();
            const player = CurrentGame().state().currentPlayer();
            const cashRaised = _.reduce(this.selectedStocksForSale(), (sum, amount, companyId) => {
                const companyForSale = CurrentGame().state().getCompany(companyId);
                return sum + (amount * companyForSale.price());
            }, 0);
            const moneyNeeded = this.getMoneyNeededFromStockSales() - cashRaised;

            return _(player.ownedCompanyIds()).map(companyId => {
                const companyToSell = CurrentGame().state().getCompany(companyId);
                const numOfTypeSelected = this.selectedStocksForSale()[companyId] || 0;
                const isCurrentCompany = companyId === company.id;
                const maxAvailable = Math.max(player.getMaximumAllowedSalesOfCompany(companyId,
                                                                                     isCurrentCompany) - (isCurrentCompany ? company.numCanIssue() : 0));
                const numNeeded = Math.ceil(moneyNeeded / companyToSell.price());
                const numAllowed = moneyNeeded <= 0 ? numOfTypeSelected : Math.min(numOfTypeSelected + numNeeded,
                                                                                   maxAvailable);
                return {
                    company: companyToSell,
                    available: maxAvailable,
                    num: numAllowed
                }
            }).reject({available: 0}).sortBy(company => company.nickname).value();
        });


        this.availableCompanyTrains = ko.computed(() => {
            if (!this.selectedTrainSource() || this.selectedTrainSource() === 'bank') {
                return [];
            }
            const company = CurrentGame().state().getCompany(this.selectedTrainSource());
            return company.getNonPhasedOutTrains();

        });

        this.currentCompanyTrains = ko.computed(() => {
            if (this.selectedAction() !== Actions.RETURN_TRAIN) {
                return [];
            }
            const company = CurrentGame().state().currentCompany();
            return company.getNonPhasedOutTrains();

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
                                          price: this.privatePrice(),
                                          ignoreToken: !this.useCWIToken()
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
                return new BuyTrains({
                                         companyId: CurrentGame().state().currentCompanyId(),
                                         trainIds: this.selectedCompanyTrainsForPurchase(),
                                         source: this.selectedTrainSource(),
                                         cost: this.companyTrainPurchasePrice()
                                     });
            }
            else if (this.selectedAction() === Actions.BUY_TRAINS && this.selectedTrainSource() === 'bank' && _.keys(
                    this.selectedBankTrainsForPurchase()).length > 0) {
                return new BuyTrains({
                                         companyId: CurrentGame().state().currentCompanyId(),
                                         trains: this.selectedBankTrainsForPurchase(),
                                         source: this.selectedTrainSource()
                                     });
            }
            else if (this.selectedAction() === Actions.BUY_TRAINS && this.selectedTrainSource() === 'bank' && this.selectedForcedTrainForPurchase()) {
                if (!this.needsStockSales() || this.hasEnoughStockSales()) {
                    return new BuyTrains({
                                             playerId: CurrentGame().state().currentPlayerId(),
                                             companyId: CurrentGame().state().currentCompanyId(),
                                             trains: [this.selectedForcedTrainForPurchase()],
                                             source: this.selectedTrainSource(),
                                             numIssued: this.numIssuedForForceBuy(
                                                 CurrentGame().state().currentCompany(),
                                                 this.selectedForcedTrainForPurchase()),
                                             stockSales: this.selectedStocksForSale(),
                                             forced: true
                                         });
                }
            }
            else if (this.selectedAction() === Actions.CLOSE_COMPANY) {
                return new ForceIssueCloseCompany({
                                                      playerId: CurrentGame().state().currentPlayerId(),
                                                      companyId: CurrentGame().state().currentCompanyId(),
                                                      count: this.maximumForcedIssues()
                                                  });
            }
            else if (this.selectedAction() === Actions.BANKRUPT) {
                return new DeclareBankruptcy({
                                                 playerId: CurrentGame().state().currentPlayerId(),
                                                 companyId: CurrentGame().state().currentCompanyId()
                                             });
            }
            else if (this.selectedAction() === Actions.RETURN_TRAIN && this.selectedTrainToReturn()) {
                return new ReturnTrain({
                                           companyId: CurrentGame().state().currentCompanyId(),
                                           trainId: this.selectedTrainToReturn()
                                       });
            }
        });

        Events.on('undo', () => {
            if (CurrentGame().state().isOperatingRound()) {
                this.reset();
                this.checkInMiddlePrivateLay();
            }
        });

        Events.on('turnEnd', () => {
            this.reset();
        });

        Events.on('stateUpdated', () => {
            this.checkInMiddlePrivateLay();
        });
    }

    canDoPlayerSteamboat() {
        if (CurrentGame().state().currentCompany() || !CurrentGame().state().currentPlayer()) {
            return false;
        }

        if(this.hasPlacedSteamboatThisTurn()) {
            return false;
        }

        return true;
    }

    canBuyPrivates() {
        if (!CurrentGame().state().currentCompany() || !CurrentGame().state().currentPlayer() || this.midInterruption()) {
            return false;
        }

        const company = CurrentGame().state().currentCompany();
        if (company.type !== CompanyTypes.PUBLIC) {
            return false;
        }

        if (!company.president()) {
            return false;
        }

        if (this.isMiddleOfPrivateLays()) {
            return false;
        }

        return CurrentGame().state().currentPlayer().getPrivates().length > 0 && company.cash() > 0;
    }

    canUsePrivates() {
        if (!CurrentGame().state().currentCompany() || this.midInterruption()) {
            return false;
        }

        return this.useablePrivates().length > 0;
    }

    canIssue() {
        if (!CurrentGame().state().currentCompany() || this.midInterruption()) {
            return false;
        }

        const company = CurrentGame().state().currentCompany();
        if (company.type !== CompanyTypes.PUBLIC) {
            return false;
        }

        if (!company.president()) {
            return false;
        }

        if (this.isMiddleOfPrivateLays()) {
            return false;
        }

        return !this.hasRunRoutesThisTurn() && !this.hasIssuedThisTurn() && !this.hasRedeemedThisTurn() && this.getNumCanIssue() > 0;
    }

    canRedeem() {
        if (!CurrentGame().state().currentCompany() || this.midInterruption()) {
            return false;
        }

        const company = CurrentGame().state().currentCompany();
        if (company.type !== CompanyTypes.PUBLIC) {
            return false;
        }

        if (!company.president()) {
            return false;
        }

        if (this.isMiddleOfPrivateLays()) {
            return false;
        }

        return !this.hasRunRoutesThisTurn() && !this.hasRedeemedThisTurn() && !this.hasIssuedThisTurn() && this.getNumCanRedeem() > 0;
    }

    canLayTrackOrToken() {
        if (!CurrentGame().state().currentCompany() || this.midInterruption()) {
            return false;
        }

        const company = CurrentGame().state().currentCompany();
        if (!company.president()) {
            return false;
        }

        if (this.hasRunRoutesThisTurn()) {
            return false;
        }

        if (this.isMiddleOfPrivateLays()) {
            return false;
        }

        return true;
    }

    canRunRoutes() {
        if (!CurrentGame().state().currentCompany() || this.midInterruption()) {
            return false;
        }

        if (this.hasRunRoutesThisTurn()) {
            return false;
        }

        if (this.isMiddleOfPrivateLays()) {
            return false;
        }

        return true;
    }

    canBuyTrains() {
        if (!CurrentGame().state().currentCompany() || this.midInterruption()) {
            return false;
        }
        const currentCompany = CurrentGame().state().currentCompany();

        if (currentCompany.type !== CompanyTypes.PUBLIC) {
            return false;
        }

        if (!this.hasRunRoutesThisTurn()) {
            return false;
        }

        if (currentCompany.numTrainsForLimit() >= CurrentGame().state().trainLimit()) {
            return false;
        }

        return this.canBuyTrainFromCompany() || this.canBuyTrainFromBank() || this.canEmergencyBuy();
    }

    canDoAnything() {
        return this.canDoPlayerSteamboat() || this.canBuyPrivates() || this.canUsePrivates() || this.canIssue() || this.canRedeem() || this.canLayTrackOrToken() || this.canRunRoutes() || this.canBuyTrains() || this.canCloseCompany() || this.canEmergencyBuy() || this.canGoBankrupt() || this.mustReturnTrain() || this.interruptionNeeded();
    }

    checkInMiddlePrivateLay() {
        const privateId = this.isMiddleOfPrivateLays();
        if (privateId) {
            this.selectAction(Actions.USE_PRIVATES);
            this.selectPrivate(privateId);
        }
    }

    calculateStockMovement(revenue) {
        const currentPrice = CurrentGame().state().currentCompany().price();
        if (revenue === 0) {
            return -1;
        }
        else if (revenue < currentPrice) {
            return 0;
        }
        else if (revenue < currentPrice * 2) {
            return 1;
        }
        else if (revenue < currentPrice * 3 || currentPrice < 165) {
            return 2;
        }
        else {
            return 3;
        }
    }

    calculateStockMovementDisplay(movement) {
        if (movement === -1) {
            return '\u21E0 price';
        }
        else if (movement === 0) {
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

    isLSLAbility() {
        return this.selectedAction() === Actions.USE_PRIVATES
               && this.selectedPrivateId() === CompanyIDs.LAKE_SHORE_LINE;
    }

    isMeatPackingAbility() {
        return this.selectedAction() === Actions.USE_PRIVATES
               && this.selectedPrivateId() === CompanyIDs.MEAT_PACKING_COMPANY;
    }

    isSteamboatAbility() {
        return (this.selectedAction() === Actions.PLAYER_STEAMBOAT && this.selectedSteamboatCompany()) || (this.selectedAction() === Actions.USE_PRIVATES
               && this.selectedPrivateId() === CompanyIDs.STEAMBOAT_COMPANY);
    }

    isMiddleOfPrivateLays() {
        return _([CompanyIDs.OHIO_INDIANA, CompanyIDs.MICHIGAN_CENTRAL]).find(privateId => {
            return this.numPrivateTrackLays(privateId) === 1 && !CurrentGame().state().getCompany(privateId).used()
        });
    }

    skipSecondPrivateLay() {
        const skipAction = new SkipSecondPrivateLay({
                                                        companyId: CurrentGame().state().currentCompanyId(),
                                                        privateId: this.selectedPrivateId()
                                                    });
        skipAction.execute(CurrentGame().state());
        CurrentGame().saveLocalState();
    }

    getCompaniesWithTrains() {
        if (!CurrentGame().state().currentCompany().president()) {
            return [];
        }

        return _(CurrentGame().state().currentPlayer().presidentCompanyIds()).reject(
            companyId => companyId === CurrentGame().state().currentCompany().id).map(
            companyId => CurrentGame().state().getCompany(companyId)).filter(
            company => company.trains().length > 0).value();
    }

    canAllocateRevenue() {
        return CurrentGame().state().currentCompany().type !== CompanyTypes.INDEPENDANT && CurrentGame().state().currentCompany().president();
    }

    getSteamboatCompanies() {
        const state = CurrentGame().state();
        const player = state.currentPlayer();
        const companies = _.filter(state.publicCompanies,
                                   company => company.president() === player.id);
        if(player.hasPrivate(CompanyIDs.MICHIGAN_SOUTHERN)) {
            companies.push(state.getCompany(CompanyIDs.MICHIGAN_SOUTHERN));
        }
        if(player.hasPrivate(CompanyIDs.BIG_4)) {
            companies.push(state.getCompany(CompanyIDs.BIG_4));
        }
        return _.sortBy(companies, 'nickname');
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
        return company.numCanIssue();
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

    numPrivateTrackLays(privateId) {
        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }
        return _.filter(turn.getActions(), action => {
            return action.getTypeName() === 'LayTrack' && action.privateId === privateId;
        }).length;
    }

    hasUpgradedTrackThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'LayTrack' && action.upgrade && !action.privateId;
        });
    }

    hasLaidTwoTrackThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.filter(turn.getActions(), action => {
                return action.getTypeName() === 'LayTrack' && !action.privateId;
            }).length === 2;
    }

    hasPlacedSteamboatThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'PlaceSteamboat';
        });
    }

    hasGoneBankrupt() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'DeclareBankruptcy';
        });
    }


    canBuyTrainFromBank() {
        if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
            return false;
        }
        const company = CurrentGame().state().currentCompany();
        return CurrentGame().state().bank.getCheapestTrainCost() <= company.cash();
    }

    canBuyTrainFromCompany() {
        if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
            return false;
        }

        const company = CurrentGame().state().currentCompany();
        return this.getCompaniesWithTrains().length > 0 && company.cash() > 0;
    }

    canEmergencyBuy() {
        if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
            return false;
        }

        const company = CurrentGame().state().currentCompany();
        if (!company.president()) {
            return false;
        }

        return company.numTrainsForLimit() === 0 && !this.canBuyTrainFromBank() && !this.willGoBankrupt();
    }

    numIssuedForForceBuy(company, trainType) {
        const trainDefinition = TrainDefinitions[trainType];
        const neededCash = trainDefinition.cost - company.cash();
        const numCanIssue = this.getNumCanIssue();
        return _.reduce(_.range(1, numCanIssue + 1), (accumulator, value) => {
            if (accumulator.remaining > 0) {
                accumulator.remaining -= Prices.leftPrice(company.priceIndex(), value);
                accumulator.issued = value;
            }
            return accumulator;
        }, {remaining: neededCash, issued: 0}).issued;
    }

    cashFromStockSales(company, player, numIssued) {
        const state = CurrentGame().state();
        return _.reduce(player.ownedCompanyIds(), (sum, companyId) => {
            const companyToSell = state.getCompany(companyId);
            const isCurrentCompany = companyId === company.id;
            const numToSell = Math.max(0, player.getMaximumAllowedSalesOfCompany(companyId,
                                                                                 isCurrentCompany) - (isCurrentCompany ? numIssued : 0));
            return sum + companyToSell.price() * numToSell;
        }, 0);
    }

    getSingleCheapestTrain() {
        const state = CurrentGame().state();
        return _(state.bank.getFirstAvailablePhaseTrains()).map(trainType => {
            const trainDefinition = TrainDefinitions[trainType];
            return {
                type: trainDefinition.id,
                cost: trainDefinition.cost,
                num: 1,
                available: 1
            }
        }).minBy(train => 'cost');
    }

    maximumForcedIssues() {
        const numCanIssue = this.getNumCanIssue();

        if (this.willGoBankrupt()) {
            return numCanIssue;
        }

        if (this.canEmergencyBuy()) {
            const state = CurrentGame().state();
            const availableTrains = _(state.bank.getFirstAvailablePhaseTrains()).map(trainType => {
                const trainDefinition = TrainDefinitions[trainType];
                return {
                    type: trainDefinition.id,
                    cost: trainDefinition.cost,
                    num: 1,
                    available: 1
                }
            }).value();
            const company = CurrentGame().state().currentCompany();
            const cashAfterFullForcedIssue = company.cash() + company.cashFromForcedIssues(numCanIssue);
            const affordableTrainsTreasuryOnly = _.filter(availableTrains,
                                                          trainData => cashAfterFullForcedIssue >= trainData.cost);
            if (affordableTrainsTreasuryOnly.length > 0) {
                const maxCost = _(affordableTrainsTreasuryOnly).map(train => train.cost).max();
                let maxIssue = 0;
                _.each(_.rangeRight(1, numCanIssue + 1), value => {
                    if (company.cash() + company.cashFromForcedIssues(value) > maxCost) {
                        maxIssue = value;
                    }
                    else {
                        return false;
                    }
                });
                return maxIssue;
            }
            else {
                return numCanIssue;
            }
        }

        return 0;
    }

    canCloseCompany() {
        if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
            return false;
        }
        const company = CurrentGame().state().currentCompany();
        if (company.closed()) {
            return false;
        }

        if (company.numTrainsForLimit() > 0 || this.canBuyTrainFromBank()) {
            return false;
        }

        const numIssuable = this.maximumForcedIssues();
        return Prices.leftIndex(company.priceIndex(), numIssuable) === 0;
    }

    canGoBankrupt() {
        return this.willGoBankrupt() && !this.hasGoneBankrupt() && !this.canCloseCompany();
    }

    getMoneyNeededFromStockSales() {
        const trainType = this.selectedForcedTrainForPurchase();
        const cost = TrainDefinitions[trainType].cost;
        const company = CurrentGame().state().currentCompany();
        const player = CurrentGame().state().currentPlayer();
        return cost - (company.cash() + company.cashFromForcedIssues(company.numCanIssue()) + player.cash())
    }

    needsStockSales() {
        if (!this.canEmergencyBuy()) {
            return false;
        }
        return this.getMoneyNeededFromStockSales() > 0;
    }

    moneyNeededAfterCurrentStockSales() {
        const cashRaised = _.reduce(this.selectedStocksForSale(), (sum, amount, companyId) => {
            const companyForSale = CurrentGame().state().getCompany(companyId);
            return sum + (amount * companyForSale.price());
        }, 0);
        return this.getMoneyNeededFromStockSales() - cashRaised;
    }

    hasEnoughStockSales() {
        return this.moneyNeededAfterCurrentStockSales() <= 0;
    }


    willGoBankrupt() {
        if (!CurrentGame().state().currentCompany()) {
            return false;
        }
        const company = CurrentGame().state().currentCompany();
        if (company.closed()) {
            return false;
        }

        const player = CurrentGame().state().currentPlayer();

        if (company.numTrainsForLimit() > 0) {
            return false;
        }

        if (!this.hasRunRoutesThisTurn()) {
            return false;
        }

        const cheapestBankTrain = CurrentGame().state().bank.getCheapestTrainCost();
        if (company.cash() >= cheapestBankTrain) {
            return false;
        }

        let moneyNeeded = cheapestBankTrain - company.cash();

        // Check share issues:
        moneyNeeded -= company.cashFromForcedIssues(company.numCanIssue());
        if (moneyNeeded <= 0) {
            return false;
        }

        // Check player cash:
        moneyNeeded -= player.cash();
        if (moneyNeeded <= 0) {
            return false;
        }

        // Check stock sales:
        moneyNeeded -= this.cashFromStockSales(company, player, company.numCanIssue());

        return moneyNeeded > 0;
    }

    noPresidentAndCannotBuyTrain() {
        const company = CurrentGame().state().currentCompany();
        const cheapestBankTrain = CurrentGame().state().bank.getCheapestTrainCost();
        return !company.president() && company.cash() < cheapestBankTrain;
    }

    canEndTurn() {
        const state = CurrentGame().state();
        if (!state.isOperatingRound()) {
            return true;
        }
        const company = state.currentCompany();
        return (!company && this.hasPlacedSteamboatThisTurn()) || (this.hasRunRoutesThisTurn() && (company.numTrainsForLimit() > 0 || this.hasGoneBankrupt() || this.noPresidentAndCannotBuyTrain()));
    }

    getTrainsAvailableToForceBuy() {
        if (!this.canEmergencyBuy()) {
            return [];
        }
        const state = CurrentGame().state();
        const company = state.currentCompany();
        const player = CurrentGame().state().currentPlayer();
        const availableTrains = _(state.bank.getFirstAvailablePhaseTrains()).map(trainType => {
            const trainDefinition = TrainDefinitions[trainType];
            return {
                type: trainDefinition.id,
                cost: trainDefinition.cost,
                num: 1,
                available: 1
            }
        }).value();

        // If we can force issue to buy one, give the options
        const cashAfterForcedIssue = company.cash() + company.cashFromForcedIssues(company.numCanIssue());
        const affordableTrainsTreasuryOnly = _.filter(availableTrains,
                                                      trainData => cashAfterForcedIssue >= trainData.cost);
        if (affordableTrainsTreasuryOnly.length > 0) {
            return affordableTrainsTreasuryOnly;
        }

        // Otherwise everything can go to pay
        const cashAfterEverything = cashAfterForcedIssue + player.cash() + this.cashFromStockSales(company, player,
                                                                                                   company.numCanIssue());
        const affordableTrains = _.filter(availableTrains, trainData => cashAfterEverything >= trainData.cost);
        if (affordableTrains.length > 0) {
            return affordableTrains;
        }
    }

    mustReturnTrain() {
        if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
            return false;
        }
        const state = CurrentGame().state();
        const company = state.currentCompany();
        return company.hasTooManyTrains();
    }

    selectAction(actionId) {
        this.reset();
        this.selectedAction(actionId);
        const company = CurrentGame().state().currentCompany();
        if (this.selectedAction() === Actions.BUY_PRIVATES) {
            this.useCWIToken(true);
        }
        else if (this.selectedAction() === Actions.USE_PRIVATES) {
            if (this.useablePrivates().length === 1) {
                this.selectPrivate(this.useablePrivates()[0].id);
            }
        }
        else if (this.selectedAction() === Actions.RUN_ROUTES) {

            const trains = _(company.getRunnableTrains()).map(train => train.clone()).value();
            this.companyTrains(trains);
            Events.emit('drawRoutes', _.map(this.companyTrains(), train => train.route));

            if (this.companyTrains().length === 0) {
                this.selectedAllocation(Allocations.NONE);
            }
            else {
                this.selectTrain(_.first(this.companyTrains()));
                if (!company.president()) {
                    this.selectedAllocation(Allocations.NONE);
                }
            }

            if (company.type === CompanyTypes.INDEPENDANT) {
                this.selectedAllocation(Allocations.HALF);
            }

        }
        else if (this.selectedAction() === Actions.BUY_TRAINS) {
            if (this.getCompaniesWithTrains().length === 0) {
                this.selectedTrainSource('bank');
            }
        }
        else if (this.selectedAction() === Actions.BANKRUPT) {
            this.commit();
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
        const selectingTrain = !_.find(this.selectedCompanyTrainsForPurchase(),
                                       trainId => trainId === selectedTrain.id);
        if (selectingTrain) {
            const numTrains = CurrentGame().state().currentCompany().numTrainsForLimit();
            const trainLimit = CurrentGame().state().trainLimit();
            const numSelected = this.selectedCompanyTrainsForPurchase().length;
            const numLeft = trainLimit - (numSelected + numTrains);
            if (numLeft > 0) {
                this.selectedCompanyTrainsForPurchase.push(selectedTrain.id);
            }
        }
        else {
            this.selectedCompanyTrainsForPurchase.remove(trainId => trainId === selectedTrain.id)
        }
    }

    isCompanyTrainSelectedForPurchase(id) {
        return _.find(this.selectedCompanyTrainsForPurchase(), trainId => trainId === id);
    }

    selectBankTrainForPurchase(trainType, amount) {
        this.selectedBankTrainsForPurchase.valueWillMutate();
        if (this.selectedBankTrainsForPurchase()[trainType] === amount) {
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

    numSelectedBankTrainsForPhaseForPurchase(phaseId) {
        const state = CurrentGame().state();
        const trainsForPhase = state.bank.getTrainsForPhase(phaseId);
        return _.reduce(trainsForPhase, (sum, trainType) => {
            return sum + (this.selectedBankTrainsForPurchase()[trainType] || 0);
        }, 0);
    }

    numSelectedBankTrainsForPurchase() {
        return _(this.selectedBankTrainsForPurchase()).values().sum();
    }

    selectForcedTrainForPurchase(selectedTrain) {
        this.selectedForcedTrainForPurchase(selectedTrain.type);
    }

    selectStockForSale(companyId, amount) {
        this.selectedStocksForSale.valueWillMutate();
        if (this.selectedStocksForSale()[companyId] === amount) {
            delete this.selectedStocksForSale()[companyId];
        }
        else {
            this.selectedStocksForSale()[companyId] = amount;
        }
        this.selectedStocksForSale.valueHasMutated();
    }

    isStockSelectedForSale(companyId, amount) {
        return this.selectedStocksForSale()[companyId] === amount;
    }

    selectTrainToReturn(selectedTrain) {
        this.selectedTrainToReturn(selectedTrain.id);
    }

    interruptionNeeded() {
        if (!CurrentGame() || !CurrentGame().state().currentCompany()) {
            return false;
        }

        if (this.midInterruption()) {
            return false;
        }

        if (this.mustReturnTrain()) {
            return false;
        }

        const trainLimitIssue = _.find(CurrentGame().state().publicCompanies, company => {
            return company.hasTooManyTrains();
        });

        return trainLimitIssue ? 'trainLimit' : null;
    }

    midInterruption() {
        return CurrentGame().state().interruptionType();
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
        this.selectedCompanyTrainsForPurchase([]);
        this.selectedForcedTrainForPurchase(null);
        this.selectedStocksForSale({});
        this.selectedTrainToReturn(null);
        this.useCWIToken(false);
        this.selectedSteamboatCompany(null);
        Events.emit('clearRoutes');
    }

    commit() {
        this.action().execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.reset();
    }
}

export default OperatingRound;