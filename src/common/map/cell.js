import ko from 'knockout';
import _ from 'lodash';
import TileManifest from '1846/config/tileManifest';
import MapTileIDs from '1846/config/mapTileIds';
import CurrentGame from 'common/game/currentGame';

class Cell {
    constructor(data) {
        data = data || {};

        this.id = data.id;
        this.upgradeable = data.upgradeable || true;
        this.top = data.top || 0;
        this.left = data.left || 0;
        this.row = data.row || 0;
        this.col = data.col || 0;
        this.tile = ko.observable(data.tile);
        this.preview = ko.observable(data.preview);
        this.allowedPreviewPositions = ko.observableArray([]);
        this.neighbors = data.neighbors || [null,null,null,null,null,null];
        this.visibleTile = ko.computed(() => {
            return this.preview() || this.tile();
        });

        this.popoverParams = ko.computed(() => {
            return {
                placement: 'right',
                trigger: this.preview() ? 'manual' : 'click',
                closestDiv: true,
                content: '<div data-bind="template: { name: \'views/cellPopover\' }"></div>'
            };
        });
    }

    canEdit() {
        return this.getUpgradeTiles().length > 0;
    }

    getUpgradeTiles() {
        return _.filter(CurrentGame().state().manifest.getUpgradesForTile(this.tile().id) || [], (upgrade) => {
            return this.getAllowedTilePositions(this.tile(), upgrade.tile.id).length > 0;
        });
    }

    getAllowedTilePositions(oldTile, newTileId) {
        return _(_.range(0, 6)).filter((pos) => {
            // Check against existing tile connections
            if (oldTile) {
                const oldConnectionsIds = this.getConnectionIdsForPosition(oldTile.id, oldTile.position());
                const newConnectionsIds = this.getConnectionIdsForPosition(newTileId, pos);

                if(_.difference(oldConnectionsIds, newConnectionsIds).length > 0) {
                    return false;
                }
            }

            // Check off map
            const connectionOffMap = _.find(TileManifest.getTileDefinition(newTileId).connections, (connection) => {
                if(connection[0] < 7 && !this.neighbors[(connection[0] + pos) % 6]) {
                    return true;
                }

                if(connection[1] < 7 && !this.neighbors[(connection[1] + pos) % 6]) {
                    return true;
                }
            });

            if(connectionOffMap) {
                return false;
            }

            // Check base tiles w/ connections
            if (oldTile && _.indexOf(_.values(MapTileIDs),oldTile.id) >= 0) {
                // console.log('Checking tile ' + this.id + ' for valid neighbor connections for new tile id ' + newTileId + ' and position ' + pos);
                const baseTileConnection = _.find(TileManifest.getTileDefinition(newTileId).connections, (connection) => {
                    const connectionStart = Cell.getOffsetIndexForPosition(connection[0], pos);
                    const connectionEnd = Cell.getOffsetIndexForPosition(connection[1], pos);
                    // console.log('connection: [' + connection[0] + ','+connection[1] + '] => [' + connectionStart + ',' + connectionEnd+']');

                    if(connectionStart < 7 ) {
                        const startNeighbor = this.neighbors[connectionStart];
                        // console.log('neighbor at index ' + connectionStart + ' is ' + (startNeighbor ? startNeighbor.id : 'missing'));
                        if(startNeighbor && startNeighbor.hasConnectionAtIndex(Cell.getNeighboringConnectionIndex(connectionStart))) {
                            // console.log('neighbor at index has a connection');
                            return true;
                        }
                    }

                    if(connectionEnd < 7 ) {
                        const endNeighbor = this.neighbors[connectionEnd];
                        // console.log('neighbor at index ' + connectionEnd + ' is ' + (endNeighbor ? endNeighbor.id : 'missing'));
                        if(endNeighbor && endNeighbor.hasConnectionAtIndex(Cell.getNeighboringConnectionIndex(connectionEnd))) {
                            // console.log('neighbor at index has a connection');
                            return true;
                        }
                    }
                });

                if(!baseTileConnection) {
                    return false;
                }
            }

            return true;

            // check station connections

            // check connection costs (including base cost if necessary)
        }).value();
    }

    getConnectionIdsForPosition(tileId, position) {
        return _.map(TileManifest.getTileDefinition(tileId).connections, (connection) => {
            const newStart = Cell.getOffsetIndexForPosition(connection[0], position);
            const newEnd = Cell.getOffsetIndexForPosition(connection[1], position);
            return Math.min(newStart,newEnd) + '-' + Math.max(newStart,newEnd);
        });
    }

    hasConnectionAtIndex(index) {
        return _.find(TileManifest.getTileDefinition(this.tile().id).connections, (connection) => {
            if(Cell.getOffsetIndexForPosition(connection[0], this.tile().position()) === index) {
                return true;
            }

            if(Cell.getOffsetIndexForPosition(connection[1], this.tile().position()) === index) {
                return true;
            }
        });
    }

    static getNeighboringConnectionIndex(index) {
        return (index + 3) % 6;
    }

    static getOffsetIndexForPosition(index, position) {
        return index < 7 ? (index + position) % 6 : index;
    }


    previewTile(tileId) {
        const tile = TileManifest.createTile(tileId);
        this.allowedPreviewPositions(this.getAllowedTilePositions(this.tile(), tileId));
        tile.position(this.allowedPreviewPositions()[0]);
        this.preview(tile);
    }

    nextPreviewPosition() {
        const currentPosition = this.preview().position();
        const currentIndex = _.indexOf(this.allowedPreviewPositions(), currentPosition);
        const nextIndex = (currentIndex+1) % this.allowedPreviewPositions().length;
        this.preview().position(this.allowedPreviewPositions()[nextIndex]);
    }

    cancelPreview() {
        this.preview(null);
        this.allowedPreviewPositions([]);
    }

    commitPreview() {
        // do action
        const previewTile = this.preview();
        const existingTile = this.tile() || {};
        const newTile = CurrentGame().state().manifest.getTile(previewTile.id, existingTile.id);
        newTile.position(previewTile.position());
        if(newTile.id === 5) {
            newTile.tokens(['bando']);
        }
        this.tile(newTile);
        this.cancelPreview();
    }
}

export default Cell;