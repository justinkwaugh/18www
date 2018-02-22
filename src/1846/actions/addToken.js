import Action from 'common/game/action';
import _ from 'lodash';

class AddToken extends Action {

    constructor(args) {
        super(args);

        this.cellId = args.cellId;
        this.cityId = args.cityId;
        this.companyId = args.companyId;
        this.cost = args.cost;
        this.reserved = args.reserved;
        this.oldRoutes = args.oldRoutes || {}
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        const tile = state.tilesByCellId[this.cellId];
        tile.addToken(this.companyId, this.cityId);
        if (_.find(tile.getReservedTokensForCity(this.cityId), reservedToken => this.companyId === reservedToken)) {
            this.reserved = true;
            tile.removeReservedToken(this.companyId);
        }
        company.useToken();
        company.removeCash(this.cost);
        state.bank.addCash(this.cost);

        this.updateRoutes(state);
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        company.returnToken();
        const tile = state.tilesByCellId[this.cellId];
        tile.removeToken(this.companyId, this.cityId);
        if (this.reserved) {
            tile.addReservedToken(this.companyId);
        }
        company.addCash(this.cost);
        state.bank.removeCash(this.cost);
        this.undoRoutes(state);
    }

    updateRoutes(state) {
        _.each(state.allCompaniesById(), company => {
            if (company.closed()) {
                return;
            }
            _.each(company.getNonRustedTrains(), train => {
                if(!train.route.isValid()) {
                    this.oldRoutes[train.route.id] = train.route.clone();
                    train.route.clear();
                }
            });
        });
    }

    undoRoutes(state) {
        _.each(state.allCompaniesById(), company => {
            if (company.closed()) {
                return;
            }
            _.each(company.getNonRustedTrains(), train => {
                const oldRoute = this.oldRoutes[train.route.id];
                if(oldRoute) {
                    train.route = oldRoute.clone();
                }
            });
        });
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        return company.nickname + ' tokened ' + this.cellId + ' for $' + this.cost;
    }
}

AddToken.registerClass();

export default AddToken