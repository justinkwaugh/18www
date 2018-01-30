import Action from 'common/game/action';

class SkipSecondPrivateLay extends Action {

    constructor(args) {
        super(args);
        this.companyId = args.companyId;
        this.privateId = args.privateId;
    }

    doExecute(state) {
        const privateCompany = state.getCompany(this.privateId);
        privateCompany.used(true);
    }

    doUndo(state) {
        const privateCompany = state.getCompany(this.privateId);
        privateCompany.used(false);
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        const privateCompany = state.getCompany(this.privateId);
        return company.nickname + ' skipped ' + privateCompany.name + '\'s second tile lay';
    }
}

SkipSecondPrivateLay.registerClass();

export default SkipSecondPrivateLay