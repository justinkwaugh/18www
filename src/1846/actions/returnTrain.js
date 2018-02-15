import Action from 'common/game/action';
import TrainDefinitions from '1846/config/trainDefinitions';

class ReturnTrain extends Action {

    constructor(args) {
        super(args);
        this.companyId = args.companyId;
        this.trainId = args.trainId;
        this.train = args.train;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        this.train = company.removeTrainById(this.trainId).clone();
        state.bank.addTrains(this.train.type,1);
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        state.bank.removeTrains(this.train.type, 1);
        company.addTrain(this.train.clone());
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        const trainDefinition = TrainDefinitions[this.train.type];
        return company.nickname + ' returned a ' + trainDefinition.name + 'T to the bank';
    }

    confirmation(state) {
        const company = state.getCompany(this.companyId);
        const train = company.getTrainById(this.trainId);
        const trainDefinition = TrainDefinitions[train.type];
        return 'Confirm return ' + trainDefinition.name + 'T to the bank?';
    }
}

ReturnTrain.registerClass();

export default ReturnTrain