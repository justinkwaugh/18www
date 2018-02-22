import Action from 'common/game/action';
import OffBoardIDs from '1846/config/offBoardIds';
import _ from 'lodash';

const LocationNames = {
    [OffBoardIDs.CHICAGO_CONNECTIONS]: 'Chicago Connections',
    [OffBoardIDs.HOLLAND]: 'Holland',
    [OffBoardIDs.ST_LOUIS]: 'St Louis',
    D14: 'Toledo',
    G19: 'Wheeling'
};

class PlaceSteamboat extends Action {

    constructor(args) {
        super(args);
        this.playerId = args.playerId;
        this.companyId = args.companyId;
        this.cellId = args.cellId;
        this.oldCellId = args.oldCellId;
        this.oldCompanyId = args.oldCompanyId;
    }

    doExecute(state) {
        const tile = state.tilesByCellId[this.cellId];
        this.oldCellId = _.findKey(state.tilesByCellId, tile=> tile.hasSteamboat());
        if(this.oldCellId) {
            const oldTile = state.tilesByCellId[this.oldCellId];
            this.oldCompanyId = oldTile.hasSteamboat();
            oldTile.hasSteamboat(null);
        }
        tile.hasSteamboat(this.companyId);
        this.recalculateRouteRevenue(state);
    }

    doUndo(state) {
        const tile = state.tilesByCellId[this.cellId];
        tile.hasSteamboat(null);
        if(this.oldCellId) {
            state.tilesByCellId[this.oldCellId].hasSteamboat(this.oldCompanyId);
        }
        this.recalculateRouteRevenue(state);
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
        const player = state.playersById()[this.playerId];
        const company = state.getCompany(this.companyId);
        return (player ? player.name() : company.nickname) + ' placed steamboat token' + (player ? ' assigned to ' + company.nickname : '') + ' in ' + LocationNames[this.cellId];
    }
}

PlaceSteamboat.registerClass();

export default PlaceSteamboat