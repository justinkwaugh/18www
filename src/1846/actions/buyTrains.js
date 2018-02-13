import Action from 'common/game/action';
import Train from 'common/model/train';
import TrainDefinitions from '1846/config/trainDefinitions';
import TrainIDs from '1846/config/trainIds';
import PhaseIDs from '1846/config/phaseIds';
import Prices from '1846/config/prices';
import _ from 'lodash';

const NumberWords = ['zero', 'one', 'two', 'three', 'four'];

class BuyTrains extends Action {

    constructor(args) {
        super(args);

        this.companyId = args.companyId;
        this.playerId = args.playerId;
        this.trains = args.trains;
        this.source = args.source;
        this.trainIds = args.trainIds || [];
        this.oldPhase = args.oldPhase;
        this.closedCompanyData = args.closedCompanyData;
        this.meatTileId = args.meatTileId;
        this.steamboatTileId = args.steamboatTileId;
        this.cost = args.cost;
        this.forced = args.forced;
        this.numIssued = args.numIssued;
        this.oldCompanyCash = args.oldCompanyCash;
        this.oldPriceIndex = args.oldPriceIndex;
        this.stockSales = args.stockSales;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        if (this.forced) {
            const player = state.playersById()[this.playerId];
            const trainDefinition = TrainDefinitions[this.trains[0]];
            const trainType = this.trains[0];
            const cost = trainDefinition.cost;
            this.oldCompanyCash = company.cash();
            this.oldPriceIndex = company.priceIndex();
            this.oldPlayerCash = player.cash();
            if (this.numIssued) {
                const certs = company.removeCerts(this.numIssued);
                state.bank.addCerts(certs);
                company.addCash(this.cashFromForcedIssues(company, this.numIssued));
                company.priceIndex(Prices.leftIndex(company.priceIndex(), this.numIssued));
            }

            if(this.stockSales) {
                // Sell and add cash to player
            }

            const playerCashNeeded = cost - company.cash();
            if(playerCashNeeded) {
                player.removeCash(playerCashNeeded);
                company.addCash(playerCashNeeded);
            }

            company.removeCash(cost);
            state.bank.addCash(cost);
            state.bank.removeTrains(trainType, 1);

            const newTrain = new Train({type: trainType});
            newTrain.route.color = company.getAvailableRouteColor();
            newTrain.route.companyId = company.id;
            newTrain.purchased = true;
            company.addTrain(newTrain);
            this.trainIds.push(newTrain.id);

            const newPhase = this.getNewPhase(state, trainType);
            if (newPhase) {
                this.oldPhase = state.currentPhaseId();
                state.currentPhaseId(newPhase);
                this.doPhaseChange(state, newPhase);
            }
        }
        else if (this.source === 'bank') {
            _.each(this.trains, (amount, type) => {
                const trainDefinition = TrainDefinitions[type];
                const cost = amount * trainDefinition.cost;
                company.removeCash(cost);
                state.bank.addCash(cost);
                state.bank.removeTrains(type, amount);
                const newTrains = _(_.range(0, amount)).map(value => new Train({type})).value();
                _.each(newTrains, newTrain => {
                    newTrain.route.color = company.getAvailableRouteColor();
                    newTrain.route.companyId = company.id;
                    newTrain.purchased = true;
                    company.addTrain(newTrain);
                    this.trainIds.push(newTrain.id);
                });

                const newPhase = this.getNewPhase(state, type);
                if (newPhase) {
                    this.oldPhase = state.currentPhaseId();
                    state.currentPhaseId(newPhase);
                    this.doPhaseChange(state, newPhase);
                }
            });
        }
        else {
            const sellingCompany = state.getCompany(this.source);
            this.trains = _(sellingCompany.removeTrainsById(this.trainIds)).map(train => train.clone()).sortBy(
                train => train.type).value();
            const trainsToAdd = _.map(this.trains, train => {
                const newTrain = train.clone();
                newTrain.route.color = company.getAvailableRouteColor();
                newTrain.route.companyId = company.id;
                newTrain.purchased = true;
                return newTrain;
            });
            company.addTrains(trainsToAdd);
            sellingCompany.addCash(this.cost);
            company.removeCash(this.cost);
        }
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        if (this.forced) {
            const player = state.playersById()[this.playerId];
            const trainDefinition = TrainDefinitions[this.trains[0]];
            const trainType = this.trains[0];
            const cost = trainDefinition.cost;
            player.cash(this.oldPlayerCash);
            company.cash(this.oldCompanyCash);
            if(this.numIssued) {
                const certs = state.bank.removeNonPresidentCertsForCompany(this.numIssued, this.companyId);
                company.addCerts(certs);
                company.priceIndex(this.oldPriceIndex);
            }
            state.bank.removeCash(cost);
            state.bank.addTrains(trainType, 1);
            _.each(this.trainIds, id => {
                company.removeTrainById(id);
            });

            if (this.oldPhase) {
                const currentPhase = state.currentPhaseId();
                this.undoPhaseChange(state, currentPhase);
                state.currentPhaseId(this.oldPhase);
            }
        }
        else if (this.source === 'bank') {
            _.each(this.trains, (amount, type) => {
                const trainDefinition = TrainDefinitions[type];
                const cost = amount * trainDefinition.cost;
                company.addCash(cost);
                state.bank.removeCash(cost);
                state.bank.addTrains(type, amount);
                _.each(this.trainIds, id => {
                    company.removeTrainById(id);
                });
            });

            if (this.oldPhase) {
                const currentPhase = state.currentPhaseId();
                this.undoPhaseChange(state, currentPhase);
                state.currentPhaseId(this.oldPhase);
            }
        }
        else {
            const sellingCompany = state.getCompany(this.source);
            company.removeTrainsById(this.trainIds);
            sellingCompany.addTrains(_.map(this.trains, train => train.clone()));
            sellingCompany.removeCash(this.cost);
            company.addCash(this.cost);
        }
    }

    cashFromForcedIssues(company, numIssued) {
        return _.reduce(_.range(1, numIssued + 1), (sum, value) => {
            return sum + Prices.leftPrice(company.priceIndex(), value);
        }, 0);
    }

    doPhaseChange(state, newPhase) {

        if (newPhase === PhaseIDs.PHASE_III) {
            const closedCompanyData = [];
            _.each(state.publicCompanies, company => {
                company.phaseOut(PhaseIDs.PHASE_I);
            });
            _.each(state.privateCompanies, company => {
                closedCompanyData.push(company.close());
            });
            this.closedCompanyData = closedCompanyData;
            state.trainLimit(3);
        }
        else if (newPhase === PhaseIDs.PHASE_IV) {
            _.each(state.publicCompanies, company => {
                company.phaseOut(PhaseIDs.PHASE_II);
                company.rust(PhaseIDs.PHASE_I);
            });
            const meatTile = _.find(state.tilesByCellId, tile => {
                return tile.hasMeat();
            });

            if (meatTile) {
                meatTile.hasMeat(false);
                this.meatTileId = meatTile.id;
            }
            const steamBoatTile = _.find(state.tilesByCellId, tile => {
                return tile.hasSteamboat();
            });

            if (steamBoatTile) {
                steamBoatTile.hasSteamboat(false);
                this.steamboatTileId = steamBoatTile.id;
            }
            state.trainLimit(2);
        }
    }

    undoPhaseChange(state, newPhase) {
        if (newPhase === PhaseIDs.PHASE_III) {
            _.each(state.publicCompanies, company => {
                company.unphaseOut(PhaseIDs.PHASE_I);
            });
            _.each((this.closedCompanyData || []), closeData => {
                const company = state.getCompany(closeData.id);
                company.unclose(closeData);
            });
            state.trainLimit(4);
        }
        else if (newPhase === PhaseIDs.PHASE_IV) {
            _.each(state.publicCompanies, company => {
                company.unphaseOut(PhaseIDs.PHASE_II);
                company.unrust(PhaseIDs.PHASE_I);
            });

            if (this.meatTileId) {
                const tile = state.tilesByCellId[this.meatTileId];
                tile.hasMeat(true);
            }

            if (this.steamboatTileId) {
                const tile = state.tilesByCellId[this.steamboatTileId];
                tile.hasSteamboat(true);
            }
            state.trainLimit(3);
        }
    }

    getNewPhase(state, type) {
        const currentPhase = state.currentPhaseId();
        if (currentPhase === PhaseIDs.PHASE_I && (type === TrainIDs.TRAIN_3_5 || type === TrainIDs.TRAIN_4)) {
            return PhaseIDs.PHASE_II;
        }
        else if (currentPhase === PhaseIDs.PHASE_II && (type === TrainIDs.TRAIN_4_6 || type === TrainIDs.TRAIN_5)) {
            return PhaseIDs.PHASE_III;
        }
        else if (currentPhase === PhaseIDs.PHASE_III && (type === TrainIDs.TRAIN_6 || type === TrainIDs.TRAIN_7_8)) {
            return PhaseIDs.PHASE_IV;
        }
        return null;
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        const descData = this.getTrainDescriptionsAndCost(state, true);
        const source = this.source === 'bank' ? 'the bank' : state.getCompany(this.source).nickname;
        const suffix = this.getSuffix(company, true);
        return company.nickname + ' bought ' + _.join(descData.desc,
                                                      ', ') + ' from ' + source + ' for $' + descData.cost + suffix;
    }

    confirmation(state) {
        const prefix = 'Confirm buy ';
        const company = state.getCompany(this.companyId);
        const descData = this.getTrainDescriptionsAndCost(state);
        const source = this.source === 'bank' ? 'the bank' : state.getCompany(this.source).nickname;
        const suffix = this.getSuffix(company, true);
        return prefix + _.join(descData.desc, ', ') + ' from ' + source + ' for $' + descData.cost + suffix;
    }

    getSuffix(company, summary) {
        if (!this.forced) {
            return '';
        }
        return (summary ? ' issuing ' : ' issued ') + this.numIssued + ' share' + (this.numIssued === 1 ? '' : 's') + ' - stock drops to $' + Prices.leftPrice(
                company.priceIndex(), this.numIssued);

    }

    getTrainDescriptionsAndCost(state, summary) {
        const result = {
            desc: [],
            cost: 0
        };
        if (this.forced) {
            const trainDefinition = TrainDefinitions[this.trains[0]];
            result.desc = ['a ' + trainDefinition.name + 'T'];
            result.cost = trainDefinition.cost;
        }
        else if (this.source === 'bank') {
            const data = _.reduce(this.trains, (accumulator, amount, type) => {
                const trainDefinition = TrainDefinitions[type];
                const cost = amount * trainDefinition.cost;
                accumulator.desc.push(NumberWords[amount] + ' ' + trainDefinition.name + 'T');
                accumulator.cost += cost;
                return accumulator;
            }, {desc: [], cost: 0});
            result.desc = data.desc;
            result.cost = data.cost;
        }
        else {
            if (!summary) {
                const sellingCompany = state.getCompany(this.source);
                result.desc = _.map(this.trainIds, trainId => {
                    const train = sellingCompany.getTrainById(trainId);
                    if (!train) {
                        return '';
                    }
                    const trainDefinition = TrainDefinitions[train.type];
                    return trainDefinition.name + 'T';
                });
            }
            else {
                result.desc = _.map(this.trains, train => {
                    const trainDefinition = TrainDefinitions[train.type];
                    return trainDefinition.name + 'T';
                });
            }
            result.cost = this.cost;
        }
        return result;
    }
}

BuyTrains.registerClass();

export default BuyTrains