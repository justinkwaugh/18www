import Action from 'common/game/action';

class AddToken extends Action {

    constructor(args) {
        super(args);

        this.cellId = args.cellId;
        this.cityId = args.cityId;
        this.companyId = args.companyId;
        this.cost = args.cost;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        const tile = state.tilesByCellId[this.cellId];
        tile.addToken(this.companyId, this.cityId);
        company.removeCash(this.cost);
        state.bank.addCash(this.cost);
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        const tile = state.tilesByCellId[this.cellId];
        tile.removeToken(this.companyId, this.cityId);
        company.addCash(this.cost);
        state.bank.removeCash(this.cost);
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        return company.nickname + ' tokened ' + this.cellId + ' for $' + this.cost;
    }
}

AddToken.registerClass();

export default AddToken