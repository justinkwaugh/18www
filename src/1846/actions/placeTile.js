import Action from 'common/game/action';
import _ from 'lodash';

class PlaceTile extends Action {

    constructor(args) {
        super(args);

        this.tileId = args.tileId;
        this.cellId = args.cellId;
        this.position = args.position;
        this.companyId = args.companyId;
        this.oldTileId = args.oldTileId;
    }

    doExecute(state) {
        const company = state.publicCompaniesById[this.companyId];

        // figure out cost
        const cost = 20;
        company.removeCash(20);

    }

    doUndo(state) {

    }

    summary(state) {
        const company = state.publicCompaniesById[this.companyId];
        return company.nickname + ' laid a ' + this.tileId + ' tile at ' + this.cellId;
    }
}

PlaceTile.registerClass();

export default PlaceTile