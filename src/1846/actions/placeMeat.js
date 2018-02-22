import Action from 'common/game/action';

class PlaceMeat extends Action {

    constructor(args) {
        super(args);
        this.companyId = args.companyId;
        this.privateId = args.privateId;
        this.cellId = args.cellId;
    }

    doExecute(state) {
        const privateCompany = state.getCompany(this.privateId);
        privateCompany.used(true);
        const tile = state.tilesByCellId[this.cellId];
        tile.hasMeat(this.companyId);
        this.recalculateRouteRevenue(state)
    }

    doUndo(state) {
        const privateCompany = state.getCompany(this.privateId);
        privateCompany.used(false);
        const tile = state.tilesByCellId[this.cellId];
        tile.hasMeat(null);
        this.recalculateRouteRevenue(state)
    }

    recalculateRouteRevenue(state) {
        _.each(state.allCompaniesById(), company => {
            if (company.closed()) {
                return;
            }
            _.each(company.getNonRustedTrains(), train => {
                train.route.calculateRevenue();
            });
        });
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        const location = this.cellId === 'D6' ? 'Chicago' : 'St Louis';
        return company.nickname + ' placed meat packing token in ' + location;
    }
}

PlaceMeat.registerClass();

export default PlaceMeat