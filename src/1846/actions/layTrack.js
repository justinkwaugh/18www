import Action from 'common/game/action';
import MapTileIDs from '1846/config/mapTileIds';
import TileColorIDs from '1846/config/tileColorIds';
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
        this.privateId = args.privateId;
        this.privateDone = args.privateDone;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        const oldTile = state.tilesByCellId[this.cellId];
        this.oldTileId = oldTile.id;
        this.oldTilePosition = oldTile.position();
        this.upgrade = _.indexOf([TileColorIDs.INVISIBLE, TileColorIDs.YELLOW, TileColorIDs.GREEN, TileColorIDs.BROWN], oldTile.colorId) >= 0;
        const newTile = state.manifest.getTile(this.tileId, this.oldTileId);
        newTile.position(this.position);
        oldTile.copyToTile(newTile);
        state.tilesByCellId[this.cellId] = newTile;

        company.removeCash(this.cost);
        state.bank.addCash(this.cost);

        if(this.privateId && this.privateDone) {
            const privateCompany = state.getCompany(this.privateId);
            privateCompany.used(true);
        }

        Events.emit('tileUpdated.' + this.cellId);
        Events.emit('trackLaid');
        if(this.upgrade) {
            this.upgradeRoutes(state, this.cellId, oldTile, newTile);
        }
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        const newTile = state.tilesByCellId[this.cellId];
        const oldTile = state.manifest.getTile(this.oldTileId, this.tileId);
        oldTile.position(this.oldTilePosition);
        newTile.copyToTile(oldTile);
        state.tilesByCellId[this.cellId] = oldTile;

        if(this.privateId && this.privateDone) {
            const privateCompany = state.getCompany(this.privateId);
            privateCompany.used(false);
        }

        company.addCash(this.cost);
        state.bank.removeCash(this.cost);
        Events.emit('tileUpdated.' + this.cellId);
        Events.emit('trackLaid', this);
        if(this.upgrade) {
            this.upgradeRoutes(state, this.cellId, newTile, oldTile);
        }
    }

    upgradeRoutes(state, cellId, oldTile, newTile) {
        _.each(state.allCompaniesById, company=> {
                if(company.closed()) {
                    return;
                }
                _.each(company.getRunnableTrains(), train=>{
                    train.route.upgradeConnections(this.cellId, oldTile, newTile);
                });
            });
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        const privateCompany = state.getCompany(this.privateId);
        return company.nickname + (privateCompany ? ' used ' + privateCompany.name + ' to lay' : ' laid') + ' a #' + this.tileId + ' tile at ' + this.cellId + ' for $' + this.cost;
    }
}

LayTrack.registerClass();

export default LayTrack