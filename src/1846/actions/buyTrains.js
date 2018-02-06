import Action from 'common/game/action';
import Train from 'common/model/train';
import TrainDefinitions from '1846/config/trainDefinitions';
import TrainIDs from '1846/config/trainIds';
import PhaseIDs from '1846/config/phaseIds';

import _ from 'lodash';

const NumberWords = ['zero', 'one', 'two', 'three', 'four'];

class BuyTrains extends Action {

    constructor(args) {
        super(args);

        this.companyId = args.companyId;
        this.trains = args.trains;
        this.source = args.source;
        this.trainIds = args.trainIds;
        this.oldPhase = args.oldPhase;
        this.closedCompanyData = args.closedCompanyData;
        this.meatTileId = args.meatTileId;
        this.steamboatTileId = args.steamboatTileId;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        this.trainIds = [];
        if (this.source === 'bank') {
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
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        if (this.source === 'bank') {
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
    }

    doPhaseChange(state, newPhase) {

        if (newPhase === PhaseIDs.PHASE_III) {
            const closedCompanyData = [];
            _.each(state.publicCompanies, company => {
                company.phaseOut(PhaseIDs.PHASE_I);
            });
            _.each(state.privateCompanies, company=> {
                closedCompanyData.push(company.close());
            });
            this.closedCompanyData = closedCompanyData;
        }
        else if (newPhase === PhaseIDs.PHASE_IV) {
            _.each(state.publicCompanies, company => {
                company.phaseOut(PhaseIDs.PHASE_II);
                company.rust(PhaseIDs.PHASE_I);
            });
            const meatTile = _.find(state.tilesByCellId, tile => {
                return tile.hasMeat();
            });

            if(meatTile) {
                meatTile.hasMeat(false);
                this.meatTileId = meatTile.id;
            }
            const steamBoatTile = _.find(state.tilesByCellId, tile => {
                return tile.hasSteamboat();
            });

            if(steamBoatTile) {
                steamBoatTile.hasSteamboat(false);
                this.steamboatTileId = steamBoatTile.id;
            }
        }
    }

    undoPhaseChange(state, newPhase) {
        if (newPhase === PhaseIDs.PHASE_III) {
            _.each(state.publicCompanies, company => {
                company.unphaseOut(PhaseIDs.PHASE_I);
            });
            _.each((this.closedCompanyData || []), closeData=> {
                const company = state.getCompany(closeData.id);
                company.unclose(closeData);
            });
        }
        else if (newPhase === PhaseIDs.PHASE_IV) {
            _.each(state.publicCompanies, company => {
                company.unphaseOut(PhaseIDs.PHASE_II);
                company.unrust(PhaseIDs.PHASE_I);
            });

            if(this.meatTileId) {
                const tile = state.tilesByCellId[this.meatTileId];
                tile.hasMeat(true);
            }

            if(this.steamboatTileId) {
                const tile = state.tilesByCellId[this.steamboatTileId];
                tile.hasSteamboat(true);
            }
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
        const data = _.reduce(this.trains, (accumulator, amount, type) => {
            const trainDefinition = TrainDefinitions[type];
            const cost = amount * trainDefinition.cost;
            accumulator.desc.push(NumberWords[amount] + ' ' + trainDefinition.name + 'T');
            accumulator.cost += cost;
            return accumulator;
        }, {desc: [], cost: 0});
        const source = this.source === 'bank' ? 'the bank' : state.getCompany(this.source).nickname;
        return company.nickname + ' bought ' + _.join(data.desc, ', ') + ' from ' + source + ' for $' + data.cost;
    }

    confirmation(state) {
        const prefix = 'Confirm buy ';
        const data = _.reduce(this.trains, (accumulator, amount, type) => {
            const trainDefinition = TrainDefinitions[type];
            const cost = amount * trainDefinition.cost;
            accumulator.desc.push(NumberWords[amount] + ' ' + trainDefinition.name + 'T');
            accumulator.cost += cost;
            return accumulator;
        }, {desc: [], cost: 0});
        const source = this.source === 'bank' ? 'the bank' : state.getCompany(this.source).nickname;
        return prefix + _.join(data.desc, ', ') + ' from ' + source + ' for $' + data.cost;
    }

}

BuyTrains.registerClass();

export default BuyTrains