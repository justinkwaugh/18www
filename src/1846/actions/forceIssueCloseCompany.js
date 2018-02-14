import Action from 'common/game/action';

class ForceIssueCloesCompany extends Action {

    constructor(args) {
        super(args);
        this.companyId = args.companyId;
        this.playerId = args.playerId;
        this.count = args.count;
        this.closeData = args.closeData;

    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        this.closeData = company.close();
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        company.unclose(this.closeData);
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        return company.nickname + '\'s stock moved to $0 due to force issuing ' + this.count + ' shares for a train buy, closing the company';
    }

    confirmation(state) {
        const company = state.getCompany(this.companyId);
        return 'Confirm company close due to force issuing ' + this.count + ' shares for train buy';
    }
}

ForceIssueCloesCompany.registerClass();

export default ForceIssueCloesCompany