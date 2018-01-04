import ko from 'knockout';
import _ from 'lodash';
import TileManifest from '1846/config/tileManifest';
import MapTileIDs from '1846/config/mapTileIds';
import CurrentGame from 'common/game/currentGame';
import PhaseIDs from '1846/config/phaseIds';
import TileColorIDs from '1846/config/tileColorIds';
import RoundIDs from '1846/config/roundIds';
import CompanyIDs from '1846/config/companyIds';
import LayTrack from '1846/actions/layTrack';
import AddToken from '1846/actions/addToken';
import Events from 'common/util/events';
import TerrainTypes from '1846/config/terrainTypes';

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

        this.id = data.id;
        this.upgradeable = data.upgradeable || true;
        this.top = data.top || 0;
        this.left = data.left || 0;
        this.row = data.row || 0;
        this.col = data.col || 0;
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

            return this.getUpgradeTiles();
        });

        this.tokenCheckTrigger = ko.observable().extend({notify: 'always'});

        this.tokenableCities = ko.computed(() => {

            if (!CurrentGame()) {
                return false;
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

            if (this.tile().getOpenCities(CurrentGame().state().currentCompanyId()).length === 0) {
                return false;
            }

            const turn = CurrentGame().state().turnHistory.currentTurn();
            if (!turn) {
                return false;
            }

            const hasTokened = _.find(turn.getActions(), action => {
                return action.getTypeName() === 'AddToken';
            });

            if (hasTokened) {
                return false;
            }

            const company = CurrentGame().state().currentCompany();
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

            const layingTrack = CurrentGame().operatingRound().selectedAction() === CurrentGame().operatingRound().Actions.LAY_TRACK;
            const oandi = this.isOhioIndianaLay();
            const mc = this.isMichiganCentralLay();
            const lsl = CurrentGame().operatingRound().selectedAction() === CurrentGame().operatingRound().Actions.USE_PRIVATES
                        && CurrentGame().operatingRound().selectedPrivateId() === CompanyIDs.LAKE_SHORE_LINE
                        && (this.id === 'D14' || this.id === 'E17');
            if (!layingTrack && !oandi && !mc && !lsl) {
                return false;
            }

            return this.upgradeTiles().length > 0 || this.canToken();
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
            if(!neighbor) {
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
        if (this.isOhioIndianaLay()) {
            return this.getOhioIndianaTiles();
        }

        const phase = CurrentGame().state().currentPhaseId();

        return _.filter(CurrentGame().state().manifest.getUpgradesForTile(this.tile().id) || [], (upgrade) => {
            if (phase === PhaseIDs.PHASE_I && upgrade.tile.colorId !== TileColorIDs.YELLOW) {
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

    getOhioIndianaTiles() {
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
            // Need to check station connection for B&O and PRR
        }

        return cost;
    }

    getBaseCost() {
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
            if (neighbor.tile().colorId === TileColorIDs.YELLOW) {
                const neighborConnectionIndex = Cell.getNeighboringConnectionIndex(neighborEdge);
                const neighborConnectionPoint = neighbor.getConnectionPointAtIndex(this, neighborConnectionIndex);
                if (neighborConnectionPoint < 0) {
                    return false;
                }

                const connectsToNeighbor = _.find(this.getConnectionsForPosition(newTileId, pos), connection => {
                    return connection[0] === neighborEdge || connection[1] === neighborEdge;
                });
                if (!connectsToNeighbor) {
                    return false;
                }
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
        const baseCost = this.getBaseCost();
        if (company.cash() < baseCost) {
            return [];
        }

        return _(_.range(0, 6)).map((pos) => {
            // Check against existing tile connections
            const oldConnectionsIds = this.getConnectionIdsForPosition(oldTile.id, oldTile.position());
            const newConnectionsIds = this.getConnectionIdsForPosition(newTileId, pos);

            if (_.difference(oldConnectionsIds, newConnectionsIds).length > 0) {
                return null;
            }

            const addedConnectionIds = _.difference(newConnectionsIds, oldConnectionsIds);
            const addedConnections = _(this.getConnectionsForPosition(newTileId, pos)).filter(
                connection => _.indexOf(addedConnectionIds, this.getConnectionId(connection) >= 0)).value();


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
            const connectionCosts = _(addedConnections).flatten().uniq().sumBy(edgeIndex => {
                return this.getConnectionCost(edgeIndex);
            });

            // Check new track for a path back to station
            // console.log('Checking tile ' + this.id + ' for valid neighbor connections for new tile id ' + newTileId + ' and position ' + pos);
            const connectionToStation = _.find(addedConnections,
                                               (connection) => {
                                                   const connectionStart = connection[0];
                                                   const connectionEnd = connection[1];
                                                   // console.log('connection: [' + connection[0] + ','+connection[1] + '] => [' + connectionStart + ',' + connectionEnd+']');

                                                   if (validEdges[connectionStart] || validEdges[connectionEnd]) {
                                                       return true;
                                                   }

                                                   if (connectionStart < 7) {
                                                       const isEdgeValid = this.checkNeighborConnection(company.id,
                                                                                                        connectionStart,
                                                                                                        visited);
                                                       if (isEdgeValid) {
                                                           console.log('Connection found');
                                                           validEdges[connectionStart] = true;
                                                           return true;
                                                       }

                                                   }

                                                   if (connectionEnd < 7) {
                                                       const isEdgeValid = this.checkNeighborConnection(company.id,
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

    checkNeighborConnection(companyId, edgeIndex, visited, companies) {

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
        const hasLocalStation = this.tile().hasTokenForCompany(companyId);

        return hasLocalStation || neighbor.depthFirstSearchForStation(companyId, neighborConnectionPoint,
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
                const connectionEnd = Cell.getOffsetIndexForPosition(connection[1], this.tile().position());
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

    getConnectionsForPosition(tileId, position) {
        return _.map(TileManifest.getTileDefinition(tileId).connections, (connection) => {
            const newStart = Cell.getOffsetIndexForPosition(connection[0], position);
            const newEnd = Cell.getOffsetIndexForPosition(connection[1], position);
            return [newStart, newEnd];
        });
    }

    getConnectionIdsForPosition(tileId, position) {
        return _.map(this.getConnectionsForPosition(tileId, position), (connection) => {
            return this.getConnectionId(connection);
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

    getConnectionPointAtIndex(neighbor, index) {
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
        // const previewTile = this.preview();
        // const existingTile = this.tile() || {};
        // const newTile = CurrentGame().state().manifest.getTile(previewTile.id, existingTile.id);
        // newTile.position(previewTile.position());
        // newTile.tokens(_.clone(existingTile.tokens()));
        // this.tile(newTile);
        // this.cancelPreview();
        const previewTile = this.preview();
        const privateId = this.isMichiganCentralLay() ? CompanyIDs.MICHIGAN_CENTRAL : this.isOhioIndianaLay() ? CompanyIDs.OHIO_INDIANA : null;
        const layTrack = new LayTrack({
                                          companyId: CurrentGame().state().currentCompanyId(),
                                          cellId: this.id,
                                          tileId: previewTile.id,
                                          position: previewTile.position(),
                                          cost: this.allowedPreviewPositionData()[previewTile.position()].cost,
                                          privateId,
                                          privateDone: privateId && CurrentGame().operatingRound().hasPrivateLaidTrack()
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

    onMouseOver() {
        console.log('mousing over cell ' + this.id);
    }

    onMouseEnter() {
        console.log('mouse entering cell ' + this.id);
    }

    onMouseOut() {
        console.log('mouse leaving cell ' + this.id);
    }

    onMouseDown() {
        console.log('mouse down on ' + this.id);
    }

    onMouseUp() {
        console.log('mouse up on ' + this.id);
    }

}

export default Cell;