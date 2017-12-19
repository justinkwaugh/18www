import ko from 'knockout';
import _ from 'lodash';
import TileManifest from '1846/config/tileManifest';
import MapTileIDs from '1846/config/mapTileIds';
import CurrentGame from 'common/game/currentGame';
import PhaseIDs from '1846/config/phaseIds';
import TileColorIDs from '1846/config/tileColorIds';
import RoundIDs from '1846/config/roundIds';

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
        this.neighbors = data.neighbors || [null, null, null, null, null, null];
        this.visibleTile = ko.computed(() => {
            return this.preview() || this.tile();
        });
        this.upgradeTiles = ko.computed(() => {
            if (!CurrentGame()) {
                return [];
            }

            return this.getUpgradeTiles();
        });
        this.canEdit = ko.computed(() => {
            if (!CurrentGame()) {
                return false;
            }

            if (!CurrentGame().state().isOperatingRound()) {
                return false;
            }

            if (!CurrentGame().operatingRound().canLayTrackOrToken()) {
                return false;
            }

            return this.upgradeTiles().length > 0;
        });

        this.popoverParams = ko.computed(() => {
            return {
                enabledObservable: this.canEdit,
                placement: 'right',
                trigger: this.preview() ? 'manual' : 'click',
                closestDiv: true,
                content: '<div data-bind="template: { name: \'views/cellPopover\' }"></div>'
            };
        });
    }

    getUpgradeTiles() {

        const phase = CurrentGame().state().currentPhaseId();

        return _.filter(CurrentGame().state().manifest.getUpgradesForTile(this.tile().id) || [], (upgrade) => {
            if (phase === PhaseIDs.PHASE_I && upgrade.tile.colorId !== TileColorIDs.YELLOW) {
                return false;
            }

            if (phase === PhaseIDs.PHASE_II && _.indexOf([TileColorIDs.GREEN, TileColorIDs.YELLOW],
                                                         upgrade.tile.colorId) < 0) {
                return false;
            }

            if (phase === PhaseIDs.PHASE_III && _.indexOf([TileColorIDs.BROWN, TileColorIDs.GREEN, TileColorIDs.YELLOW],
                                                          upgrade.tile.colorId) < 0) {
                return false;
            }

            return this.getAllowedTilePositions(this.tile(), upgrade.tile.id).length > 0;
        });
    }

    getAllowedTilePositions(oldTile, newTileId) {
        // console.log('Checking tile positions for ' + this.id);

        const visited = {};
        const validEdges = {};

        return _(_.range(0, 6)).filter((pos) => {
            // Check against existing tile connections
            if (oldTile) {
                const oldConnectionsIds = this.getConnectionIdsForPosition(oldTile.id, oldTile.position());
                const newConnectionsIds = this.getConnectionIdsForPosition(newTileId, pos);

                if (_.difference(oldConnectionsIds, newConnectionsIds).length > 0) {
                    return false;
                }
            }

            // Check off map
            const connectionOffMap = _.find(TileManifest.getTileDefinition(newTileId).connections, (connection) => {
                if (connection[0] < 7 && !this.neighbors[(connection[0] + pos) % 6]) {
                    return true;
                }

                if (connection[1] < 7 && !this.neighbors[(connection[1] + pos) % 6]) {
                    return true;
                }
            });

            if (connectionOffMap) {
                return false;
            }


            // Check base tiles w/ connections
            if (oldTile && _.indexOf(_.values(MapTileIDs), oldTile.id) >= 0) {
                // console.log('Checking tile ' + this.id + ' for valid neighbor connections for new tile id ' + newTileId + ' and position ' + pos);
                const baseTileConnection = _.find(TileManifest.getTileDefinition(newTileId).connections,
                                                  (connection) => {
                                                      const connectionStart = Cell.getOffsetIndexForPosition(
                                                          connection[0], pos);
                                                      const connectionEnd = Cell.getOffsetIndexForPosition(
                                                          connection[1], pos);
                                                      // console.log('connection: [' + connection[0] + ','+connection[1] + '] => [' + connectionStart + ',' + connectionEnd+']');

                                                      if (validEdges[connectionStart] || validEdges[connectionEnd]) {
                                                          return true;
                                                      }

                                                      if (connectionStart < 7) {
                                                          const isEdgeValid = this.checkNeighborConnection(
                                                              connectionStart, visited);
                                                          if (isEdgeValid) {
                                                              console.log('Connection found');
                                                              validEdges[connectionStart] = true;
                                                              return true;
                                                          }

                                                      }

                                                      if (connectionEnd < 7) {
                                                          const isEdgeValid = this.checkNeighborConnection(
                                                              connectionEnd, visited);
                                                          if (isEdgeValid) {
                                                              console.log('Connection found');
                                                              validEdges[connectionEnd] = true;
                                                              return true;
                                                          }

                                                      }
                                                  });

                if (!baseTileConnection) {
                    return false;
                }
            }

            return true;

            // check connection costs (including base cost if necessary)
        }).value();
    }

    checkNeighborConnection(edgeIndex, visited) {

        const neighbor = this.neighbors[edgeIndex];
        if (!neighbor) {
            return false;
        }
        // console.log('Checking neighbor ' + neighbor.id + ' for connection to station');
        const neighborConnectionIndex = Cell.getNeighboringConnectionIndex(edgeIndex);
        const neighborConnectionPoint = neighbor.getConnectionPointAtIndex(neighborConnectionIndex);
        if (neighborConnectionPoint < 0) {
            return false;
        }
        const currentOperatingCompany = CurrentGame().state().currentCompanyId();
        const hasLocalStation = this.hasStationForCompany(currentOperatingCompany);

        return hasLocalStation || neighbor.depthFirstSearchForStation(currentOperatingCompany, neighborConnectionPoint,
                                                                      visited);
    }

    hasStationForCompany(companyId) {
        if (!companyId) {
            return false;
        }

        if (_.find(this.tile().tokens(), token => token === companyId)) {
            return true;
        }
    }

    depthFirstSearchForStation(companyId, connectionStart, visited) {
        // console.log('In Cell ' + this.id + ' starting at connection ' + connectionStart);
        const connections = _.map(this.tile().getConnectionsToPoint(connectionStart), connection => {
            return connection[0] === connectionStart ? connection : [connection[1], connection[0]];
        });

        let found = false;

        _.each(connections, connection => {
            const connectionId = this.id + '-' + this.getConnectionId(connection);
            if (visited[connectionId]) {
                return;
            }
            // check for city / token
            if (_.find(this.tile().tokens(), token => token === companyId)) {
                console.log('Found token!');
                found = true;
                return false;
            }

            visited[connectionId] = true;

            // start a new search from the connection point
            if (connection[1] > 6) {
                // city on this tile
                // console.log('Starting new search on this tile from local city ' + connection[1]);
                found = this.depthFirstSearchForStation(companyId, connection[1], visited);
            }
            else {
                const connectionEnd = Cell.getOffsetIndexForPosition(connection[1], this.tile().position());
                const neighbor = this.neighbors[connectionEnd];
                if (!neighbor) {
                    return;
                }
                const neighborConnectionIndex = Cell.getNeighboringConnectionIndex(connectionEnd);

                const neighborConnectionPoint = neighbor.getConnectionPointAtIndex(neighborConnectionIndex);
                if (neighborConnectionPoint >= 0) {
                    // console.log(
                    //     'Starting new search on neighbor ' + neighbor.id + ' from point ' + neighborConnectionPoint);
                    found = neighbor.depthFirstSearchForStation(companyId,
                                                                neighborConnectionPoint,
                                                                visited);
                }
                else {
                    // console.log('Neighbor not connected');
                }
            }

            if (found) {
                return false;
            }

        });

        return found;

    }

    getConnectionIdsForPosition(tileId, position) {
        return _.map(TileManifest.getTileDefinition(tileId).connections, (connection) => {
            const newStart = Cell.getOffsetIndexForPosition(connection[0], position);
            const newEnd = Cell.getOffsetIndexForPosition(connection[1], position);
            return Math.min(newStart, newEnd) + '-' + Math.max(newStart, newEnd);
        });
    }

    getConnectionId(connection) {
        return Math.min(connection[0], connection[1]) + '-' + Math.max(connection[0], connection[1]);
    }

    hasConnectionAtIndex(index) {
        return _.find(TileManifest.getTileDefinition(this.tile().id).connections, (connection) => {
            if (Cell.getOffsetIndexForPosition(connection[0], this.tile().position()) === index) {
                return true;
            }

            if (Cell.getOffsetIndexForPosition(connection[1], this.tile().position()) === index) {
                return true;
            }
        });
    }

    getConnectionPointAtIndex(index) {
        const connection = this.hasConnectionAtIndex(index);
        if (connection) {
            return Cell.getOffsetIndexForPosition(connection[0],
                                                  this.tile().position()) === index ? connection[0] : connection[1];
        }
        return -1;
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
        const nextIndex = (currentIndex + 1) % this.allowedPreviewPositions().length;
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
        newTile.tokens(_.clone(existingTile.tokens()));
        this.tile(newTile);
        this.cancelPreview();
    }
}

export default Cell;