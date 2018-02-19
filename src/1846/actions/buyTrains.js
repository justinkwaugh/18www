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
        this.closedPrivatesData = args.closedPrivatesData;
        this.meatTileId = args.meatTileId;
        this.steamboatTileId = args.steamboatTileId;
        this.cost = args.cost;
        this.forced = args.forced;
        this.numIssued = args.numIssued;
        this.stockSales = args.stockSales;
        this.closedCompanies = args.closedCompanies || {};
        this.presidentChanges = args.presidentChanges || {};
        this.oldCompanyCash = args.oldCompanyCash;
        this.oldCompanyPriceIndices = args.oldCompanyPriceIndices || {};
        this.oldPlayerCerts = args.oldPlayerCerts || [];
        this.oldPlayerCash = args.oldPlayerCash;
        this.oldBankCash = args.oldBankCash;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        if (this.forced) {
            const player = state.playersById()[this.playerId];
            const trainDefinition = TrainDefinitions[this.trains[0]];
            const trainType = this.trains[0];
            const cost = trainDefinition.cost;
            this.oldCompanyCash = company.cash();
            this.oldCompanyPriceIndices[this.companyId] = company.priceIndex();
            this.oldPlayerCash = player.cash();
            this.oldBankCash = state.bank.cash();

            if (this.numIssued) {
                const certs = company.removeCerts(this.numIssued);
                state.bank.addCerts(certs);
                company.addCash(company.cashFromForcedIssues(this.numIssued));
                company.priceIndex(Prices.leftIndex(company.priceIndex(), this.numIssued));
            }

            if (this.stockSales) {
                _.each(this.stockSales, (amount, companyId) => {
                    const ownedCompany = state.getCompany(companyId);
                    const isPresident = player.isPresidentOfCompany(companyId);
                    const closing = isPresident && Prices.leftIndex(company.priceIndex()) === 0;

                    if (closing) {
                        this.closedCompanies[companyId] = ownedCompany.close();
                    }
                    else {
                        const cashForShares = ownedCompany.price() * amount;
                        player.addCash(cashForShares);
                        state.bank.removeCash(cashForShares);

                        if (isPresident) {
                            if (player.sharesPerCompany()[this.companyId] - amount < 2) {
                                const target = _(state.players()).filter(
                                    otherPlayer => player.id !== otherPlayer.id && otherPlayer.sharesPerCompany()[companyId] >= 2).sortBy(
                                    otherPlayer => {
                                        return otherPlayer.order() > player.order() ? otherPlayer.order() : otherPlayer.order() + 10;
                                    }).first();

                                if (target) {
                                    const nonPresidentCerts = target.removeNonPresidentCertsForCompany(2, companyId);
                                    const presidentCert = player.removePresidentCertForCompany(companyId);

                                    target.addCert(presidentCert);
                                    player.addCerts(nonPresidentCerts);
                                    ownedCompany.president(target.id);
                                    this.presidentChanges[companyId] = target.id;
                                }
                            }

                            if (companyId !== this.companyId) {
                                this.oldCompanyPriceIndices[companyId] = ownedCompany.priceIndex();
                            }

                            ownedCompany.priceIndex(Prices.leftIndex(ownedCompany.priceIndex()))
                        }


                        const certs = player.removeNonPresidentCertsForCompany(amount, companyId);
                        this.oldPlayerCerts.push.apply(this.oldPlayerCerts, _.map(certs, 'id'));
                        state.bank.addCerts(certs);
                    }
                });
            }

            const playerCashNeeded = cost - company.cash();
            if (playerCashNeeded) {
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
                newTrain.route.clear();
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
            const trainType = this.trains[0];

            state.bank.addTrains(trainType, 1);
            _.each(this.trainIds, id => {
                company.removeTrainById(id);
            });

            if (this.oldPhase) {
                const currentPhase = state.currentPhaseId();
                state.currentPhaseId(this.oldPhase);
                this.undoPhaseChange(state, currentPhase);
            }

            _.each(this.stockSales, (amount, companyId) => {
                const certs = state.bank.removeNonPresidentCertsForCompany(amount, companyId);
                player.addCerts(certs);
            });

            _.each(this.presidentChanges, (otherPlayerId, companyId) => {
                if (otherPlayerId) {
                    const otherPresident = state.playersById()[otherPlayerId];
                    const nonPresidentCerts = player.removeNonPresidentCertsForCompany(2, companyId);
                    const presidentCert = otherPresident.removePresidentCertForCompany(companyId);

                    player.addCert(presidentCert);
                    otherPresident.addCerts(nonPresidentCerts);
                }
                company.president(player.id);
            });

            _.each(this.closedCompanies, (closeData, companyId) => {
                const closedCompany = state.getCompany(companyId);
                closedCompany.unclose(closeData);
            });

            if (this.numIssued) {
                const certs = state.bank.removeNonPresidentCertsForCompany(this.numIssued, this.companyId);
                company.addCerts(certs);
            }

            _.each(this.oldCompanyPriceIndices, (index, companyId) => {
                const otherCompany = state.getCompany(companyId);
                otherCompany.priceIndex(index);
            });

            player.cash(this.oldPlayerCash);
            company.cash(this.oldCompanyCash);
            state.bank.cash(this.oldBankCash);
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
                state.currentPhaseId(this.oldPhase);
                this.undoPhaseChange(state, currentPhase);

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

    doPhaseChange(state, newPhase) {

        if (newPhase === PhaseIDs.PHASE_III) {
            const closedPrivatesData = [];
            _.each(state.publicCompanies, company => {
                company.phaseOut(PhaseIDs.PHASE_I);
            });
            _.each(state.privateCompanies, company => {
                if(!company.closed()) {
                    closedPrivatesData.push(company.close());
                }
            });
            this.closedPrivatesData = closedPrivatesData;
            console.log('setting train limit to 3');
            state.trainLimit(3);
            this.recalculateRouteRevenue(state);
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
            _.each((this.closedPrivatesData || []), closeData => {
                const company = state.getCompany(closeData.id);
                company.unclose(closeData);
            });
            console.log('setting train limit to 4');
            state.trainLimit(4);
            this.recalculateRouteRevenue(state);
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

    recalculateRouteRevenue(state) {
        _.each(state.allCompaniesById, company=> {
                if(company.closed()) {
                    return;
                }
                _.each(company.getNonRustedTrains(), train=>{
                    train.route.calculateRevenue();
                });
            });
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
        let text = '';
        if (!this.forced) {
            return text;
        }
        if (this.numIssued > 0) {
            text += (summary ? ' issuing ' : ' issued ') + this.numIssued + ' share' + (this.numIssued === 1 ? '' : 's') + ' - stock drops to $' + Prices.leftPrice(
                    company.priceIndex(), this.numIssued);
        }
        return text;

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