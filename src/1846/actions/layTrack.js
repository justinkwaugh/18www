import Action from 'common/game/action';
import MapTileIDs from '1846/config/mapTileIds';
import Events from 'common/util/events';
import _ from 'lodash';

class LayTrack extends Action {

    constructor(args) {
        super(args);

        this.cellId = args.cellId;
        this.tileId = args.tileId;
        this.position = args.position;
        this.oldTileId = args.oldTileId;
        this.oldTilePosition = args.oldTilePosition;
        this.companyId = args.companyId;
        this.upgrade = args.upgrade;
        this.cost = args.cost;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        const oldTile = state.tilesByCellId[this.cellId];
        this.oldTileId = oldTile.id;
        this.oldTilePosition = oldTile.position();
        this.upgrade = Boolean(MapTileIDs[oldTile.id]);
        const newTile = state.manifest.getTile(this.tileId, this.oldTileId);
        newTile.position(this.position);
        newTile.tokens(_.clone(oldTile.tokens()));
        state.tilesByCellId[this.cellId] = newTile;

        company.removeCash(this.cost);
        state.bank.addCash(this.cost);
        Events.emit('tileUpdated.' + this.cellId);
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        const newTile = state.tilesByCellId[this.cellId];
        const oldTile = state.manifest.getTile(this.oldTileId, this.tileId);
        oldTile.position(this.oldTilePosition);
        oldTile.tokens(_.clone(newTile.tokens()));
        state.tilesByCellId[this.cellId] = oldTile;

        company.addCash(this.cost);
        state.bank.removeCash(this.cost);
        Events.emit('tileUpdated.' + this.cellId);
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        return company.nickname + ' laid a #' + this.tileId + ' tile at ' + this.cellId + ' for $' + this.cost;
    }
}

LayTrack.registerClass();

export default LayTrack