import Action from 'common/game/action';
import Train from 'common/model/train';
import TrainDefinitions from '1846/config/trainDefinitions';
import TrainIDs from '1846/config/trainIds';
import PhaseIDs from '1846/config/phaseIds';

import _ from 'lodash';

class BuyTrains extends Action {

    constructor(args) {
        super(args);

        this.companyId = args.companyId;
        this.trains = args.trains;
        this.source = args.source;
        this.trainIds = args.trainIds;
        this.oldPhase = args.oldPhase;
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
                    company.addTrain(newTrain);
                    this.trainIds.push(newTrain.id);
                });

                const newPhase = this.getNewPhase(state,type);
                if(newPhase) {
                    this.oldPhase = state.currentPhaseId();
                    state.currentPhaseId(newPhase);
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

            if(this.oldPhase) {
                state.currentPhaseId(oldPhase);
            }
        }
    }

    getNewPhase(state, type) {
        const currentPhase = state.currentPhaseId();
        if(currentPhase === PhaseIDs.PHASE_I && (type === TrainIDs.TRAIN_3_5 || type === TrainIDs.TRAIN_4)) {
            return PhaseIDs.PHASE_II;
        }
        else if(currentPhase === PhaseIDs.PHASE_II && (type === TrainIDs.TRAIN_4_6 || type === TrainIDs.TRAIN_5)) {
            return PhaseIDs.PHASE_III;
        }
        else if(currentPhase === PhaseIDs.PHASE_III && (type === TrainIDs.TRAIN_6 || type === TrainIDs.TRAIN_7_8)) {
            return PhaseIDs.PHASE_IV;
        }
        return null;
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        const data = _.reduce(this.trains, (accumulator, amount, type) => {
            const trainDefinition = TrainDefinitions[type];
            const cost = amount * trainDefinition.cost;
            accumulator.desc.push(amount + ' ' + trainDefinition.name + 'T');
            accumulator.cost += cost;
            return accumulator;
        }, {desc: [], cost: 0});
        const source = this.source === 'bank' ? 'the bank' : state.getCompany(this.source).nickname;
        return company.nickname + ' bought ' + _.join(data.desc, ',') + ' from ' + source + ' for $' + data.cost;
    }

    confirmation(state) {
        const prefix = 'Confirm buy ';
        const data = _.reduce(this.trains, (accumulator, amount, type) => {
            const trainDefinition = TrainDefinitions[type];
            const cost = amount * trainDefinition.cost;
            accumulator.desc.push(amount + ' ' + trainDefinition.name + 'T');
            accumulator.cost += cost;
            return accumulator;
        }, {desc: [], cost: 0});
        const source = this.source === 'bank' ? 'the bank' : state.getCompany(this.source).nickname;
        return prefix + _.join(data.desc, ',') + ' from ' + source + ' for $' + data.cost;
    }

}

BuyTrains.registerClass();

export default BuyTrains