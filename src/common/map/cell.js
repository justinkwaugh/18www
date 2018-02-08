import ko from 'knockout';
import _ from 'lodash';
import Tile from 'common/map/tile';
import TileManifest from '1846/config/tileManifest';
import MapTileIDs from '1846/config/mapTileIds';
import CurrentGame from 'common/game/currentGame';
import PhaseIDs from '1846/config/phaseIds';
import TileColorIDs from '1846/config/tileColorIds';
import RoundIDs from '1846/config/roundIds';
import CompanyIDs from '1846/config/companyIds';
import LayTrack from '1846/actions/layTrack';
import AddToken from '1846/actions/addToken';
import PlaceMeat from '1846/actions/placeMeat';
import PlaceSteamboat from '1846/actions/placeSteamboat';
import Events from 'common/util/events';
import TerrainTypes from '1846/config/terrainTypes';
import OffBoardIds from '1846/config/offBoardIds';

const CellCosts = {
    C15: 40,
    F18: 40,
    G17: 40,
    H16: 40,
    H14: 60
};

const FreeICCells = {
    E5: true,
    F6: true,
    G5: true,
    H6: true,
    J4: true
};

const FreeTunnelBlasterCells = {
    F18: true,
    G17: true,
    H16: true,
    H14: true
};

const ReservedTokens = {
    I5: CompanyIDs.ILLINOIS_CENTRAL,
    E11: CompanyIDs.PENNSYLVANIA,
    D20: CompanyIDs.ERIE,
    H12: CompanyIDs.BALTIMORE_OHIO
};

// Could optimize by storing known connections to stations on tiles, but would always need to refresh those if a
// token is placed, as it can break a connection by blocking

class Cell {
    constructor(data) {
        data = data || {};

        console.log('creating cell id ' + data.id + ' at ' + data.top + ',' + data.left);
        this.id = data.id;
        this.top = data.top || 0;
        this.left = data.left || 0;
        this.row = data.row || 0;
        this.col = data.col || 0;
        this.width = data.width || 126;
        this.height = data.height || 144;
        this.outline = data.outline || '0,-71.59 62,-35.796 62,35.796 0,71.59 -62,35.796 -62,-35.796';
        this.tile = ko.observable(data.tile);
        this.preview = ko.observable(data.preview);
        this.allowedPreviewPositionData = ko.observable({});
        this.allowedPreviewPositions = ko.computed(() => {
            return _.map(this.allowedPreviewPositionData(), 'position');
        });
        this.neighbors = data.neighbors || [null, null, null, null, null, null];
        this.connectionCosts = data.connectionCosts || {};
        this.visibleTile = ko.computed(() => {
            return this.preview() || this.tile();
        });
        this.upgradeTiles = ko.computed(() => {
            if (!CurrentGame()) {
                return [];
            }

            if (!CurrentGame().state().isOperatingRound()) {
                return [];
            }

            if (!CurrentGame().state().currentCompany()) {
                return [];
            }

            return this.getUpgradeTiles();
        });

        this.tokenCheckTrigger = ko.observable().extend({notify: 'always'});

        this.tokenableCities = ko.computed(() => {

            if (!CurrentGame()) {
                return [];
            }

            if (!CurrentGame().state().isOperatingRound()) {
                return [];
            }

            if (!CurrentGame().state().currentCompany()) {
                return [];
            }

            if (!this.tile()) {
                return [];
            }

            this.tokenCheckTrigger();

            const companyId = CurrentGame().state().currentCompanyId();
            const openCities = this.tile().getOpenCities(companyId);

            if (openCities.length > 0 && this.id === 'H12' && companyId === CompanyIDs.BALTIMORE_OHIO) {
                return openCities;
            }

            if (openCities.length > 0 && this.id === 'E11' && companyId === CompanyIDs.PENNSYLVANIA) {
                return openCities;
            }

            const visited = [];
            const tokenableCities = _.filter(openCities,
                                             cityId => this.depthFirstSearchForStation(companyId, cityId, visited));
            return tokenableCities;

        });

        this.canToken = ko.computed(() => {
            if (!CurrentGame()) {
                return false;
            }

            if (!CurrentGame().state().isOperatingRound()) {
                return false;
            }

            if (!CurrentGame().state().currentCompany()) {
                return false;
            }

            if (this.tile().getOpenCities(CurrentGame().state().currentCompanyId()).length === 0) {
                return false;
            }

            const turn = CurrentGame().state().turnHistory.currentTurn();
            if (!turn) {
                return false;
            }

            const company = CurrentGame().state().currentCompany();
            if (!company.tokens()) {
                return false;
            }

            const hasTokened = _.find(turn.getActions(), action => {
                return action.getTypeName() === 'AddToken';
            });

            if (hasTokened) {
                return false;
            }


            if (this.tokenableCities().length === 0) {
                return false;
            }


            const cost = this.getTokenCost();
            if (company.cash() < cost) {
                return false;
            }

            return true;
        });

        this.canEdit = ko.computed(() => {
            if (!CurrentGame()) {
                return false;
            }

            if (!CurrentGame().state().isOperatingRound()) {
                return false;
            }

            if (!CurrentGame().state().currentCompany()) {
                return false;
            }

            const layingTrack = CurrentGame().operatingRound().selectedAction() === CurrentGame().operatingRound().Actions.LAY_TRACK;
            const oandi = this.isOhioIndianaLay();
            const mc = this.isMichiganCentralLay();
            const lsl = this.isLSLLay();
            const meat = this.canPlaceMeat();
            const steamboat = this.canPlaceSteamboat();

            if (!layingTrack && !oandi && !mc && !lsl && !meat && !steamboat) {
                return false;
            }

            if ((this.isMichiganCentralLay() && !this.canLayMichiganCentral()) || (this.isOhioIndianaLay() && !this.canLayOhioIndiana())) {
                return false;
            }

            return this.upgradeTiles().length > 0 || this.canToken() || meat || steamboat;
        });

        this.canRoute = ko.computed(() => {
            if (!CurrentGame()) {
                return false;
            }

            if (!CurrentGame().state().isOperatingRound()) {
                return false;
            }

            const train = CurrentGame().operatingRound().selectedTrain();
            if (!train) {
                return false;
            }

            return true;

            return this.isRouteable(train.route);
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

        Events.on('tileUpdated.' + this.id, () => {
            this.tile(CurrentGame().state().tilesByCellId[this.id]);
        });

        Events.on('trackLaid', () => {
            this.tokenCheckTrigger(1);
        });

        Events.on('gridRestored', () => {
            this.tokenCheckTrigger(1);
        });
    }

    isRouteable(route) {
        if (route.cells().length === 0 && this.tile().hasTokenForCompany(CurrentGame().state().currentCompany().id)) {
            return true;
        }

        return _.isNumber(_(_.range(0, 6)).find((edgeIndex) => {
            if (!this.hasConnectionAtIndex(edgeIndex)) {
                return;
            }

            const neighbor = this.neighbors[edgeIndex];
            if (!neighbor) {
                return;
            }

            return route.containsCell(neighbor.id);
        }));
    }

    isOhioIndianaLay() {
        return CurrentGame().operatingRound().isOhioIndianaAbility() && (this.id === 'F14' || this.id === 'F16');
    }

    isMichiganCentralLay() {
        return CurrentGame().operatingRound().isMichiganCentralAbility() && (this.id === 'B10' || this.id === 'B12');
    }

    isLSLLay() {
        return CurrentGame().operatingRound().isLSLAbility() && (this.id === 'D14' || this.id === 'E17');
    }

    canUpgrade() {
        return this.isLSLLay() || !CurrentGame().operatingRound().hasUpgradedTrackThisTurn();
    }

    canPlaceMeat() {
        return CurrentGame().operatingRound().isMeatPackingAbility() && (this.id === 'D6' || this.id === OffBoardIds.ST_LOUIS);
    }

    canPlaceSteamboat() {
        return CurrentGame().operatingRound().isSteamboatAbility() && (this.id === 'D14' || this.id === 'G19' || this.id === OffBoardIds.HOLLAND || this.id === OffBoardIds.CHICAGO_CONNECTIONS || this.id === OffBoardIds.ST_LOUIS);
    }

    canLayMichiganCentral() {
        const michiganCentral = CurrentGame().state().getCompany(CompanyIDs.MICHIGAN_CENTRAL);
        return michiganCentral && (this.id === 'B10' || this.id === 'B12') && !michiganCentral.used();
    }

    canLayOhioIndiana() {
        const ohioIndiana = CurrentGame().state().getCompany(CompanyIDs.OHIO_INDIANA);
        return ohioIndiana && (this.id === 'F14' || this.id === 'F16') && !ohioIndiana.used();
    }

    getConnectedCompanies() {
        const companies = [];
        const visited = [];
        _(_.range(0, 6)).each((edgeIndex) => {
            if (!this.hasConnectionAtIndex(edgeIndex)) {
                return;
            }

            this.checkNeighborConnection(null, edgeIndex, visited, companies)
        });

        return _.uniq(companies);
    }

    getUpgradeTiles() {
        if (this.isOhioIndianaLay() || this.isMichiganCentralLay()) {
            return this.getOhioIndianaOrMichiganCentralTiles();
        }

        if (!this.isLSLLay() && CurrentGame().operatingRound().hasLaidTwoTrackThisTurn()) {
            return false;
        }

        const phase = CurrentGame().state().currentPhaseId();
        return _.filter(CurrentGame().state().manifest.getUpgradesForTile(this.tile().id) || [], (upgrade) => {

            if (upgrade.tile.colorId !== TileColorIDs.YELLOW && (phase === PhaseIDs.PHASE_I || !this.canUpgrade())) {
                return false;
            }

            if (phase === PhaseIDs.PHASE_II && _.indexOf([TileColorIDs.GREEN, TileColorIDs.YELLOW],
                                                         upgrade.tile.colorId) < 0) {
                return false;
            }

            if (phase === PhaseIDs.PHASE_III && _.indexOf(
                    [TileColorIDs.BROWN, TileColorIDs.GREEN, TileColorIDs.YELLOW],
                    upgrade.tile.colorId) < 0) {
                return false;
            }


            return _.keys(this.getAllowedTilePositionData(this.tile(), upgrade.tile.id)).length > 0;
        });

    }

    getOhioIndianaOrMichiganCentralTiles() {
        return _.filter(CurrentGame().state().manifest.getUpgradesForTile(this.tile().id) || [], (upgrade) => {
            if (upgrade.tile.colorId !== TileColorIDs.YELLOW) {
                return false;
            }

            return _.keys(this.getAllowedTilePositionData(this.tile(), upgrade.tile.id)).length > 0;
        });
    }

    getTokenCost() {
        const company = CurrentGame().state().currentCompany();
        let cost = 80;
        if (ReservedTokens[this.id] === company.id) {
            cost = 40;
            if (company.id === CompanyIDs.BALTIMORE_OHIO || company.id === CompanyIDs.PENNSYLVANIA) {
                const connected = this.isConnectedToStation(company.id);
                if (!connected) {
                    cost = company.id === CompanyIDs.BALTIMORE_OHIO ? 100 : 60;
                }
            }
        }
        return cost;
    }

    getBaseCost(oldTile) {
        if (this.isLSLLay()) {
            return 0;
        }

        if (!oldTile.map) {
            return 20;
        }

        const company = CurrentGame().state().currentCompany();
        let cost = CellCosts[this.id] || 20;

        if (company.id === CompanyIDs.ILLINOIS_CENTRAL && FreeICCells[this.id]) {
            cost = 0;
        }

        if (company.hasPrivate(CompanyIDs.TUNNEL_BLASTING_COMPANY) && FreeTunnelBlasterCells[this.id]) {
            cost = 0;
        }


        return cost;
    }

    getPrivatePairPositionData(oldTile, newTileId, neighborEdge) {

        const neighbor = this.neighbors[neighborEdge];
        return _(_.range(0, 6)).map((pos) => {
            const connections = Tile.getConnectionsForPosition(newTileId, pos);
            if (neighbor.tile().colorId === TileColorIDs.YELLOW) {
                const neighborConnectionIndex = Cell.getNeighboringConnectionIndex(neighborEdge);
                const neighborConnectionPoint = neighbor.getConnectionPointAtIndex(this, neighborConnectionIndex);
                if (neighborConnectionPoint < 0) {
                    return false;
                }


                const connectsToNeighbor = _.find(connections, connection => {
                    return connection[0] === neighborEdge || connection[1] === neighborEdge;
                });
                if (!connectsToNeighbor) {
                    return false;
                }


            }
            const connectionOffMap = _.find(connections, (connection) => {
                if (connection[0] < 7 && !this.neighbors[connection[0]]) {
                    return true;
                }

                if (connection[1] < 7 && !this.neighbors[connection[1]]) {
                    return true;
                }
            });

            if (connectionOffMap) {
                return null;
            }
            return {
                position: pos,
                cost: 0
            };
        }).compact().keyBy('position').value();
    }

    getAllowedTilePositionData(oldTile, newTileId) {
        const oandi = this.isOhioIndianaLay();
        const mc = this.isMichiganCentralLay();
        if (oandi || mc) {
            return this.getPrivatePairPositionData(oldTile, newTileId,
                                                   (this.id === 'F14' || this.id === 'B10') ? 1 : 4);
        }

        // console.log('Checking tile positions for ' + this.id);

        const visited = {};
        const validEdges = {};
        const state = CurrentGame().state();
        if (!state.isOperatingRound()) {
            return [];
        }

        const company = state.currentCompany();
        const baseCost = this.getBaseCost(oldTile);
        if (company.cash() < baseCost) {
            return [];
        }

        return _(_.range(0, 6)).map((pos) => {
            // Check against existing tile connections
            const oldConnectionsIds = Tile.getConnectionIdsForPosition(oldTile.id, oldTile.position());
            const newConnectionsIds = Tile.getConnectionIdsForPosition(newTileId, pos);

            if (_.difference(oldConnectionsIds, newConnectionsIds).length > 0) {
                return null;
            }

            const addedConnectionIds = _.difference(newConnectionsIds, oldConnectionsIds);
            const addedConnections = _(Tile.getConnectionsForPosition(newTileId, pos)).filter(
                connection => {
                    return this.tile().hasCity() || _.indexOf(addedConnectionIds,
                                                              this.getConnectionId(connection)) >= 0;
                }).value();


            // Check off map
            const connectionOffMap = _.find(addedConnections, (connection) => {
                if (connection[0] < 7 && !this.neighbors[connection[0]]) {
                    return true;
                }

                if (connection[1] < 7 && !this.neighbors[connection[1]]) {
                    return true;
                }
            });

            if (connectionOffMap) {
                return null;
            }

            // Check for connection costs
            const existingConnectionPoints = _(
                Tile.getConnectionsForPosition(oldTile.id, oldTile.position())).flatten().uniq().value();
            const connectionCosts = _(addedConnections).flatten().uniq().difference(existingConnectionPoints).sumBy(
                edgeIndex => {
                    return this.getConnectionCost(edgeIndex);
                });

            // Check new track for a path back to station
            // console.log('Checking tile ' + this.id + ' for valid neighbor connections for new tile id ' + newTileId + ' and position ' + pos);
            const connectionToStation = this.isLSLLay() || _.find(addedConnections,
                                                                  (connection) => {
                                                                      const connectionStart = connection[0];
                                                                      const connectionEnd = connection[1];
                                                                      // console.log('connection: [' + connection[0] + ','+connection[1] + '] => [' + connectionStart + ',' + connectionEnd+']');

                                                                      if (validEdges[connectionStart] || validEdges[connectionEnd]) {
                                                                          return true;
                                                                      }

                                                                      if (connectionStart < 7) {
                                                                          const isEdgeValid = this.checkNeighborConnection(
                                                                              company.id,
                                                                              connectionStart,
                                                                              visited);
                                                                          if (isEdgeValid) {
                                                                              console.log('Connection found');
                                                                              validEdges[connectionStart] = true;
                                                                              return true;
                                                                          }

                                                                      }

                                                                      if (connectionEnd < 7) {
                                                                          const isEdgeValid = this.checkNeighborConnection(
                                                                              company.id,
                                                                              connectionEnd,
                                                                              visited);
                                                                          if (isEdgeValid) {
                                                                              console.log('Connection found');
                                                                              validEdges[connectionEnd] = true;
                                                                              return true;
                                                                          }

                                                                      }
                                                                  });

            if (!connectionToStation) {
                return null;
            }

            const totalCost = baseCost + connectionCosts;
            if (company.cash() < totalCost) {
                return null;
            }

            return {
                position: pos,
                cost: totalCost
            };

        }).compact().keyBy('position').value();
    }

    getConnectionCost(edgeIndex) {
        if (edgeIndex > 6) {
            return 0;
        }

        const costData = this.connectionCosts[edgeIndex];
        if (!costData) {
            return 0;
        }

        if (costData.type === TerrainTypes.TUNNEL) {
            const company = CurrentGame().state().currentCompany();
            if (company.hasPrivate(CompanyIDs.TUNNEL_BLASTING_COMPANY)) {
                return 0;
            }
        }

        const neighbor = this.neighbors[edgeIndex];
        const neighborConnectionIndex = Cell.getNeighboringConnectionIndex(edgeIndex);
        const neighborConnectionPoint = neighbor.getConnectionPointAtIndex(this, neighborConnectionIndex);
        return neighborConnectionPoint >= 0 ? costData.cost : 0;
    }

    isConnectedToStation(companyId) {
        const connections = Tile.getConnectionsForPosition(this.tile().id, this.tile().position());
        const visited = {};
        return _.find(connections, connection => {
            let connected = false;

            if (connection[0] < 7) {
                connected = this.checkNeighborConnection(companyId, connection[0], visited);
            }

            if (!connected && connection[1] < 7) {
                connected = this.checkNeighborConnection(companyId, connection[1], visited);
            }
            return connected;
        });

    }

    checkNeighborConnection(companyId, edgeIndex, visited, companies) {

        const hasLocalStation = this.tile().hasTokenForCompany(companyId);
        if (hasLocalStation) {
            return true;
        }

        const neighbor = this.neighbors[edgeIndex];
        if (!neighbor) {
            return false;
        }
        // console.log('Checking neighbor ' + neighbor.id + ' for connection to station');
        const neighborConnectionIndex = Cell.getNeighboringConnectionIndex(edgeIndex);
        const neighborConnectionPoint = neighbor.getConnectionPointAtIndex(this, neighborConnectionIndex);
        if (neighborConnectionPoint < 0) {
            return false;
        }

        return neighbor.depthFirstSearchForStation(companyId, neighborConnectionPoint,
                                                   visited, companies);
    }

    depthFirstSearchForStation(companyId, connectionStart, visited, companies) {
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

            visited[connectionId] = true;

            // start a new search from the connection point
            if (connection[1] > 6) {

                // check for city / token
                if (companyId && this.tile().hasTokenForCompany(companyId, connection[1])) {
                    console.log('Found token!');
                    found = true;
                    return false;
                }
                else if (!companyId) {
                    companies.push.apply(companies, this.tile().getTokensForCity(connection[1]));
                }

                // Check blocked

                // console.log('Starting new search on this tile from local city ' + connection[1]);
                found = this.depthFirstSearchForStation(companyId, connection[1], visited, companies);
            }
            else {
                const connectionEnd = Tile.getOffsetIndexForPosition(connection[1], this.tile().position());
                const neighbor = this.neighbors[connectionEnd];
                if (!neighbor) {
                    return;
                }
                const neighborConnectionIndex = Cell.getNeighboringConnectionIndex(connectionEnd);
                const neighborConnectionPoint = neighbor.getConnectionPointAtIndex(this, neighborConnectionIndex);
                if (neighborConnectionPoint >= 0) {
                    // console.log(
                    //     'Starting new search on neighbor ' + neighbor.id + ' from point ' + neighborConnectionPoint);
                    found = neighbor.depthFirstSearchForStation(companyId,
                                                                neighborConnectionPoint,
                                                                visited,
                                                                companies);
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



    getConnectionId(connection) {
        return Math.min(connection[0], connection[1]) + '-' + Math.max(connection[0], connection[1]);
    }

    hasConnectionAtIndex(index) {
        return _.find(TileManifest.getTileDefinition(this.tile().id).connections, (connection) => {
            if (Tile.getOffsetIndexForPosition(connection[0], this.tile().position()) === index) {
                return true;
            }

            if (Tile.getOffsetIndexForPosition(connection[1], this.tile().position()) === index) {
                return true;
            }
        });
    }

    getConnectionsToCell(cell) {
        return _(this.neighbors).map((neighbor, index) => {
            if (!neighbor || neighbor.id !== cell.id) {
                return;
            }
            return this.getConnectionsToIndex(cell, index);
        }).compact().flatten().value();
    }

    getConnectionEdgeToCell(cell) {
        return _.findIndex(this.neighbors, neighbor => neighbor && neighbor.id === cell.id);
    }

    getAllConnectionEdgesToCell(cell) {
        return _(this.neighbors).map((neighbor,index)=>(neighbor && neighbor.id === cell.id) ? index: null).reject(index=>_.isNull(index)).value();
    }

    getConnectionsFromNeighborToNeighbor(neighborOne, neighborTwo, invalidConnectionIds) {
        const edgeOne = this.getConnectionEdgeToCell(neighborOne);
        const edgeTwo = this.getConnectionEdgeToCell(neighborTwo);

        if (_.keys(this.tile().cities).length > 0) {
            let edgePairs = [[edgeOne,edgeTwo]];
            if(neighborTwo.offboard) {
                const edges = this.getAllConnectionEdgesToCell(neighborTwo);
                if(edges.length > 1) {
                    edgePairs = _.map(edges, edge=> [edgeOne,edge]);
                }
            }
            else if(neighborOne.offboard) {
                const edges = this.getAllConnectionEdgesToCell(neighborOne);
                if(edges.length > 1) {
                    edgePairs = _.map(edges, edge=> [edge,edgeTwo]);
                }
            }

            return _(this.tile().cities).map(city=> {
                return _(edgePairs).map(edgePair=>_.compact([ this.getConnectionToEdges(edgePair[0], city.id), this.getConnectionToEdges(edgePair[1], city.id)])).reject(result=> {
                    const resultConnectionIds = _.map(result, connection=> Tile.getConnectionId(connection));
                    return _.intersection(resultConnectionIds, invalidConnectionIds).length > 0;
                }).first();
            }).find(connections => connections.length === 2);
        }
        else {
            return [this.getConnectionToEdges(edgeOne, edgeTwo)];
        }
    }

    getConnectionToEdges(start, end) {
        return _.find(TileManifest.getTileDefinition(this.tile().id).connections, (connection) => {
            const offsetStart = Tile.getOffsetIndexForPosition(connection[0], this.tile().position());
            const offsetEnd = Tile.getOffsetIndexForPosition(connection[1], this.tile().position());
            return (offsetStart === start || offsetStart === end ) && (offsetEnd === start || offsetEnd === end);
        });
    }

    getConnectionPointAtIndex(neighbor, index) {
        const connection = this.hasConnectionAtIndex(index);
        if (connection) {
            return Tile.getOffsetIndexForPosition(connection[0],
                                                  this.tile().position()) === index ? connection[0] : connection[1];
        }
        return -1;
    }

    getConnectionsToIndex(neighbor, index) {
        return _.filter(TileManifest.getTileDefinition(this.tile().id).connections, (connection) => {
            if (Tile.getOffsetIndexForPosition(connection[0], this.tile().position()) === index) {
                return true;
            }

            if (Tile.getOffsetIndexForPosition(connection[1], this.tile().position()) === index) {
                return true;
            }
        });
    }

    getConnectionsToPoint(neighbor, index) {
        return _.filter(TileManifest.getTileDefinition(this.tile().id).connections, (connection) => {
            if (Tile.getOffsetIndexForPosition(connection[0], 0) === index) {
                return true;
            }

            if (Tile.getOffsetIndexForPosition(connection[1], 0) === index) {
                return true;
            }
        });
    }

    static getNeighboringConnectionIndex(index) {
        return (index + 3) % 6;
    }

    addToCurrentRoute() {
        const train = CurrentGame().operatingRound().selectedTrain();
        if (!train) {
            return false;
        }

        if (this.isRouteable(train.route)) {
            train.route.addCell(this.id);
        }
    }

    previewTile(tileId) {
        const tile = TileManifest.createTile(tileId);
        this.allowedPreviewPositionData(this.getAllowedTilePositionData(this.tile(), tileId));
        tile.position(this.allowedPreviewPositions()[0]);
        this.preview(tile);
    }

    nextPreviewPosition() {
        const currentPosition = this.preview().position();
        const allowedPositions = this.allowedPreviewPositions();
        const currentIndex = _.indexOf(allowedPositions, currentPosition);
        const nextIndex = (currentIndex + 1) % allowedPositions.length;
        this.preview().position(allowedPositions[nextIndex]);
    }

    cancelPreview() {
        this.preview(null);
        this.allowedPreviewPositionData({});
    }

    commitPreview() {
        const previewTile = this.preview();
        const privateId = this.isLSLLay() ? CompanyIDs.LAKE_SHORE_LINE : this.isMichiganCentralLay() ? CompanyIDs.MICHIGAN_CENTRAL : this.isOhioIndianaLay() ? CompanyIDs.OHIO_INDIANA : null;
        const layTrack = new LayTrack({
                                          companyId: CurrentGame().state().currentCompanyId(),
                                          cellId: this.id,
                                          tileId: previewTile.id,
                                          position: previewTile.position(),
                                          cost: this.allowedPreviewPositionData()[previewTile.position()].cost,
                                          privateId,
                                          privateDone: privateId && (this.isLSLLay() || CurrentGame().operatingRound().numPrivateTrackLays(
                                              privateId) === 1)
                                      });
        layTrack.execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.cancelPreview();
    }

    tokenCity(cityId) {
        const addToken = new AddToken({
                                          companyId: CurrentGame().state().currentCompanyId(),
                                          cityId: cityId,
                                          cellId: this.id,
                                          cost: this.getTokenCost()
                                      });
        addToken.execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.cancelPreview();

    }

    placeMeat() {
        const placeMeat = new PlaceMeat({
                                            companyId: CurrentGame().state().currentCompanyId(),
                                            privateId: CompanyIDs.MEAT_PACKING_COMPANY,
                                            cellId: this.id,
                                        });
        placeMeat.execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.cancelPreview();
    }

    placeSteamboat() {
        const placeSteamboat = new PlaceSteamboat({
                                            companyId: CurrentGame().state().currentCompanyId(),
                                            cellId: this.id,
                                        });
        placeSteamboat.execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.cancelPreview();
    }
}

export default Cell;