import BaseGrid from 'common/map/baseGrid';
import MapTileIDs from '1846/config/mapTileIds';
import _ from 'lodash';
import Cell from 'common/map/cell';
import OffBoardCell from '1846/map/offBoardCell';
import Tile from 'common/map/tile';
import TileManifest from '1846/config/tileManifest';
import Events from 'common/util/events';
import CurrentGame from 'common/game/currentGame';
import TerrainTypes from '1846/config/terrainTypes';
import CompanyIDs from '1846/config/companyIds';
import OffBoardIds from '1846/config/offBoardIds';

const RowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];


const SpecialTiles = {
    A15: MapTileIDs.A15,
    B16: MapTileIDs.PORT_HURON,
    C7: MapTileIDs.C7,
    C9: MapTileIDs.CITY,
    C15: MapTileIDs.DETROIT,
    D6: MapTileIDs.CHICAGO,
    D14: MapTileIDs.CITY,
    D20: MapTileIDs.ERIE,
    E11: MapTileIDs.FORT_WAYNE,
    E17: MapTileIDs.CLEVELAND,
    E21: MapTileIDs.SALAMANCA,
    F20: MapTileIDs.HOMEWOOD,
    G3: MapTileIDs.CITY,
    G7: MapTileIDs.CITY,
    G9: MapTileIDs.INDIANAPOLIS,
    G13: MapTileIDs.CITY,
    G15: MapTileIDs.CITY,
    G19: MapTileIDs.WHEELING,
    H12: MapTileIDs.CINCINNATI,
    I5: MapTileIDs.CENTRALIA,
    I15: MapTileIDs.HUNTINGTON,
    K3: MapTileIDs.CAIRO,
    [OffBoardIds.CHICAGO_CONNECTIONS]: MapTileIDs.CHICAGO_CONNECTIONS,
    [OffBoardIds.ST_LOUIS]: MapTileIDs.ST_LOUIS,
    [OffBoardIds.HOLLAND]: MapTileIDs.HOLLAND,
    [OffBoardIds.SARNIA]: MapTileIDs.SARNIA,
    [OffBoardIds.WINDSOR]: MapTileIDs.WINDSOR,
    [OffBoardIds.LOUISVILLE]: MapTileIDs.LOUISVILLE,
    [OffBoardIds.CHARLESTON]: MapTileIDs.CHARLESTON,
    [OffBoardIds.BUFFALO]: MapTileIDs.BUFFALO,
    [OffBoardIds.BINGHAMTON]: MapTileIDs.BINGHAMTON,
    [OffBoardIds.PITTSBURGH]: MapTileIDs.PITTSBURGH,
    [OffBoardIds.CUMBERLAND]: MapTileIDs.CUMBERLAND
};


const ConnectionCosts = {
    B16: {1: {cost: 40, type: TerrainTypes.TUNNEL}},
    SARNIA: {'B16|4': {cost: 40, type: TerrainTypes.TUNNEL}},
    C15: {1: {cost: 60, type: TerrainTypes.TUNNEL}},
    WINDSOR: {'C15|4': {cost: 60, type: TerrainTypes.TUNNEL}},
    E19: {2: {cost: 40, type: TerrainTypes.TUNNEL}},
    F20: {5: {cost: 40, type: TerrainTypes.TUNNEL}},
    F18: {2: {cost: 40, type: TerrainTypes.BRIDGE}},
    G17: {1: {cost: 20, type: TerrainTypes.BRIDGE}},
    G19: {
        5: {cost: 40, type: TerrainTypes.BRIDGE},
        4: {cost: 20, type: TerrainTypes.BRIDGE},
        1: {cost: 20, type: TerrainTypes.TUNNEL}
    },
    PITTSBURGH: {'G19|4': {cost: 20, type: TerrainTypes.TUNNEL}},
    H12: {3: {cost: 40, type: TerrainTypes.BRIDGE}},
    I11: {0: {cost: 40, type: TerrainTypes.BRIDGE}},
    J4: {1: {cost: 40, type: TerrainTypes.BRIDGE}},
    J6: {4: {cost: 40, type: TerrainTypes.BRIDGE}}
};

const OffBoardDefinitions = {
    [OffBoardIds.CHICAGO_CONNECTIONS]: {
        id: OffBoardIds.CHICAGO_CONNECTIONS,
        top: 171,
        left: 9,
        row: 0,
        col: 0,
        width: 304,
        height: 110,
        outline: '-152, -55 152, -55 152, 18 88,55 -152, 55',
        connectionsToNeighborIndex: {'D6|2': 0}
    },
    [OffBoardIds.ST_LOUIS]: {
        id: OffBoardIds.ST_LOUIS,
        top: 778,
        left: 0,
        row: 0,
        col: 0,
        width: 126,
        height: 254,
        direction: 'w',
        ewbonus: 20,
        outline: '-63,-127 3,-91, 1, -19 63,17 63,89 1,127 -63, 127',
        connectionsToNeighborIndex: {'H2|0': 0, 'I3|1': 1}
    },
    [OffBoardIds.HOLLAND]: {
        id: OffBoardIds.HOLLAND,
        top: 30,
        left: 374,
        row: 0,
        col: 0,
        width: 128,
        height: 144,
        connectionsToNeighborIndex: {'B10|1': 0}
    },
    [OffBoardIds.SARNIA]: {
        id: OffBoardIds.SARNIA,
        top: 10,
        left: 994,
        row: 0,
        col: 0,
        width: 128,
        height: 128,
        direction: 'e',
        ewbonus: 20,
        outline: '-64,-8 0,-64 64,-64 64,64 -64,64',
        connectionsToNeighborIndex: {'B16|4': 0},
        connectionCosts: ConnectionCosts[OffBoardIds.SARNIA]
    },
    [OffBoardIds.WINDSOR]: {
        id: OffBoardIds.WINDSOR,
        top: 137,
        left: 932,
        row: 0,
        col: 0,
        width: 188,
        height: 144,
        direction: 'e',
        ewbonus: 30,
        outline: '-94,-36 -31,-72 94,-72 -75,50 -94,41 ',
        connectionsToNeighborIndex: {'C15|4': 0},
        connectionCosts: ConnectionCosts[OffBoardIds.WINDSOR]
    },
    [OffBoardIds.LOUISVILLE]: {
        id: OffBoardIds.LOUISVILLE,
        top: 886,
        left: 498,
        row: 0,
        col: 0,
        width: 126,
        height: 144,
        connectionsToNeighborIndex: {'I9|5': 0, 'I11|0': 1}
    },
    [OffBoardIds.CHARLESTON]: {
        id: OffBoardIds.CHARLESTON,
        top: 738,
        left: 932,
        row: 0,
        col: 0,
        width: 126,
        height: 130,
        direction: 'e',
        ewbonus: 20,
        outline: '-63,10 0,-23 0, -65 63,-65, 63,65 -63, 65',
        connections: ['I15|4', 0]
    },
    [OffBoardIds.BUFFALO]: {
        id: OffBoardIds.BUFFALO,
        top: 207,
        left: 1195,
        row: 0,
        col: 0,
        width: 174,
        height: 144,
        direction: 'e',
        ewbonus: 30,
        outline: '-87,-26 -43,-72 87,-72 87,72 -40,72 -40,1 ',
        connectionsToNeighborIndex: {'D20|3': 0, 'D20|4': 1}
    },
    [OffBoardIds.BINGHAMTON]: {
        id: OffBoardIds.BINGHAMTON,
        top: 351,
        left: 1242,
        row: 0,
        col: 0,
        width: 126,
        height: 144,
        direction: 'e',
        ewbonus: 30,
        outline: '-63,-72 63,-72 63,72 -63,72 0,35 0,-35',
        connectionsToNeighborIndex: {'E21|4': 0}
    },
    [OffBoardIds.PITTSBURGH]: {
        id: OffBoardIds.PITTSBURGH,
        top: 495,
        left: 1180,
        row: 0,
        col: 0,
        width: 188,
        height: 178,
        direction: 'e',
        ewbonus: 20,
        outline: '-94,17 -32,-19 -32,-89 94, -89 94,89 -94, 89',
        connectionsToNeighborIndex: {'F20|4': 0, 'F20|5': 1, 'G19|4': 2},
        connectionCosts: ConnectionCosts[OffBoardIds.PITTSBURGH]
    },
    [OffBoardIds.CUMBERLAND]: {
        id: OffBoardIds.CUMBERLAND,
        top: 672,
        left: 1118,
        row: 0,
        col: 0,
        width: 250,
        height: 122,
        direction: 'e',
        ewbonus: 30,
        outline: '-125,-24 -62,-61 125, -61 125,61 -125, 61',
        connectionsToNeighborIndex: {'G19|5': 0}
    }
};

class Grid extends BaseGrid {
    constructor(state) {

        super({cellSize: 124, cells: []});
        const needToInitializeState = _.keys(state.tilesByCellId).length === 0;
        this.cells(this.createCells(state));

        this.routing = false;
        this.route = null;
        this.connectNeighbors();
        if(needToInitializeState) {
            this.addTokens(state);
        }

        Events.on('stateUpdated', () => {
            _.each(CurrentGame().state().tilesByCellId, (tile, cellId) => {
                this.cellsById()[cellId].tile(tile);
            });

            Events.emit('gridRestored');
        });

        Events.on('drawRoutes', (routes) => {
            _.each(routes, route => {
                _.each(route.cells(), cellData => {
                    const tile = this.cellsById()[cellData.id].tile();
                    _.each(cellData.connections,
                           connection => tile.addRoutedConnection(connection, route.color, route.id));
                });
            });
        });

        Events.on('clearRoutes', () => {
            _.each(this.cells(), cell => cell.tile().clearRoutedConnections());
            this.route = null;
        });

        Events.on('global:mouseup', () => {
            this.finishRoute();
        });

        Events.on('global:mouseout', () => {
            this.finishRoute();
        });
    }

    createCells(state) {
        const cells = _(_.range(0, 11 * 12)).map((value) => {

            const row = Math.floor(value / 12);
            const col = value % 12;

            if (row === 0 && (col !== 6)) {
                return
            }

            if (row === 1 && ( col < 4 || col > 7)) {
                return;
            }

            if (row === 2 && ( col < 2 || col > 6)) {
                return;
            }

            if (row === 3 && ( col < 2 || col === 7 || col > 9)) {
                return;
            }

            if ((row === 4 || row === 5) && (col < 1 || col > 9)) {
                return;
            }

            if (row === 6 && col > 8) {
                return;
            }

            if (row === 7 && col > 7) {
                return;
            }

            if (row === 8 && (col === 5 || col > 6)) {
                return;
            }

            if (row === 9 && (col < 1 || col > 3)) {
                return;
            }

            if (row === 10 && col !== 0) {
                return;
            }

            const id = Grid.getIDForRowAndColumn(row, col);
            return new Cell({
                                id: id,
                                row,
                                col,
                                top: 30 + ((row - 1) * 107),
                                left: 2 + (((row - 1) % 2) ? 62 : 0) + col * 124,
                                connectionCosts: ConnectionCosts[id]
                            });
        }).compact().value();

        const offBoardCells = _.map(OffBoardIds, offBoardId => {
            return new OffBoardCell(OffBoardDefinitions[offBoardId]);
        });

        const allCells = _.concat(cells, offBoardCells);

        _.each(allCells, (cell) => {

            const existingTile = state.tilesByCellId[cell.id];
            if(!existingTile) {
                const tile = TileManifest.createTile(SpecialTiles[cell.id] || MapTileIDs.BLANK);
                state.tilesByCellId[cell.id] = tile;
                cell.tile(tile);
            }
            else {
                cell.tile(existingTile);
            }

        });

        return allCells;
    }

    addTokens(state) {

        const portHuron = this.cellsById()['B16'];
        portHuron.tile().addReservedToken(CompanyIDs.GRAND_TRUNK);

        const detroit = this.cellsById()['C15'];
        detroit.tile().addToken(CompanyIDs.MICHIGAN_SOUTHERN);

        const erie = this.cellsById()['D20'];
        erie.tile().addReservedToken(CompanyIDs.NEW_YORK_CENTRAL);

        const erieRemoved = !state.getCompany(CompanyIDs.ERIE);
        if (!erieRemoved) {
            erie.tile().addReservedToken(CompanyIDs.ERIE);
        }

        const chicago = this.cellsById()['D6'];
        chicago.tile().addReservedToken(CompanyIDs.CHICAGO_WESTERN_INDIANA, 9);

        const prrRemoved = !state.getCompany(CompanyIDs.PENNSYLVANIA);
        if (!prrRemoved) {
            const fortWayne = this.cellsById()['E11'];
            fortWayne.tile().addReservedToken(CompanyIDs.PENNSYLVANIA);
        }

        const salamanca = this.cellsById()['E21'];
        if (erieRemoved) {
            salamanca.tile().addToken('removed');
        }
        else {
            salamanca.tile().addReservedToken(CompanyIDs.ERIE);
        }

        const homewood = this.cellsById()['F20'];
        if (prrRemoved) {
            homewood.tile().addToken('removed');
        }
        else {
            homewood.tile().addReservedToken(CompanyIDs.PENNSYLVANIA);
        }

        const indianapolis = this.cellsById()['G9'];
        indianapolis.tile().addToken(CompanyIDs.BIG_4);

        const wheeling = this.cellsById()['G19'];
        wheeling.tile().addReservedToken(CompanyIDs.BALTIMORE_OHIO);

        const cincinnati = this.cellsById()['H12'];
        cincinnati.tile().addReservedToken(CompanyIDs.BALTIMORE_OHIO);

        const centralia = this.cellsById()['I5'];
        centralia.tile().addReservedToken(CompanyIDs.ILLINOIS_CENTRAL);

        const candoRemoved = !state.getCompany(CompanyIDs.CHESAPEAKE_OHIO);
        const huntington = this.cellsById()['I15'];
        if (candoRemoved) {
            huntington.tile().addToken('removed');
        }
        else {
            huntington.tile().addReservedToken(CompanyIDs.CHESAPEAKE_OHIO);
        }

        const cairo = this.cellsById()['K3'];
        cairo.tile().addReservedToken(CompanyIDs.ILLINOIS_CENTRAL);
    }

    connectNeighbors() {
        _.each(this.cells(), (cell) => {
            cell.neighbors[0] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row - 1,
                                                                           cell.col + (cell.row % 2 ? 0 : 1))];
            cell.neighbors[1] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row, cell.col + 1)];
            cell.neighbors[2] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row + 1,
                                                                           cell.col + (cell.row % 2 ? 0 : 1))];
            cell.neighbors[3] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row + 1,
                                                                           cell.col - (cell.row % 2 ? 1 : 0))];
            cell.neighbors[4] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row, cell.col - 1)];
            cell.neighbors[5] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row - 1,
                                                                           cell.col - (cell.row % 2 ? 1 : 0))];
            // console.log('Cell ' + cell.id + ' Neighbors: [' + (cell.neighbors[0] ? cell.neighbors[0].id : 'None') + ',' +
            //        (cell.neighbors[1] ? cell.neighbors[1].id : 'None') + ',' +
            //        (cell.neighbors[2] ? cell.neighbors[2].id : 'None') + ',' +
            //        (cell.neighbors[3] ? cell.neighbors[3].id : 'None') + ',' +
            //        (cell.neighbors[4] ? cell.neighbors[4].id : 'None') + ',' +
            //        (cell.neighbors[5] ? cell.neighbors[5].id : 'None') + ']');
        });

        const b10 = this.cellsById()['B10'];
        const holland = this.cellsById()[OffBoardIds.HOLLAND];
        b10.neighbors[4] = holland;
        holland.neighbors = [b10];

        const chicago = this.cellsById()['D6'];
        const chicagoConnections = this.cellsById()[OffBoardIds.CHICAGO_CONNECTIONS];
        chicago.neighbors[5] = chicagoConnections;
        chicagoConnections.neighbors = [chicago];

        const stLouis = this.cellsById()[OffBoardIds.ST_LOUIS];
        const h2 = this.cellsById()['H2'];
        h2.neighbors[3] = stLouis;
        const i3 = this.cellsById()['I3'];
        i3.neighbors[4] = stLouis;
        stLouis.neighbors = [h2, i3];

        const sarnia = this.cellsById()[OffBoardIds.SARNIA];
        const b16 = this.cellsById()['B16'];
        b16.neighbors[1] = sarnia;
        sarnia.neighbors = [b16];

        const windsor = this.cellsById()[OffBoardIds.WINDSOR];
        const c15 = this.cellsById()['C15'];
        c15.neighbors[1] = windsor;
        windsor.neighbors = [c15];

        const buffalo = this.cellsById()[OffBoardIds.BUFFALO];
        const d20 = this.cellsById()['D20'];
        d20.neighbors[0] = buffalo;
        d20.neighbors[1] = buffalo;
        buffalo.neighbors = [d20, d20];

        const binghamton = this.cellsById()[OffBoardIds.BINGHAMTON];
        const e21 = this.cellsById()['E21'];
        e21.neighbors[1] = binghamton;
        binghamton.neighbors = [e21];

        const pittsburgh = this.cellsById()[OffBoardIds.PITTSBURGH];
        const f20 = this.cellsById()['F20'];
        f20.neighbors[1] = pittsburgh;
        f20.neighbors[2] = pittsburgh;

        const g19 = this.cellsById()['G19'];
        g19.neighbors[1] = pittsburgh;
        g19.neighbors[0] = null;
        pittsburgh.neighbors = [f20, f20, g19];

        const cumberland = this.cellsById()[OffBoardIds.CUMBERLAND];
        g19.neighbors[2] = cumberland;
        cumberland.neighbors = [g19];

        const charleston = this.cellsById()[OffBoardIds.CHARLESTON];
        const i15 = this.cellsById()['I15'];
        i15.neighbors[1] = charleston;
        charleston.neighbors = [i15];

        const louisville = this.cellsById()[OffBoardIds.LOUISVILLE];
        const i9 = this.cellsById()['I9'];
        i9.neighbors[2] = louisville;

        const i11 = this.cellsById()['I11'];
        i11.neighbors[3] = louisville;
        louisville.neighbors = [i9, i11];

        const j6 = this.cellsById()['J6'];
        j6.neighbors[5] = null;

        const h4 = this.cellsById()['H4'];
        h4.neighbors[2] = null;

        const c9 = this.cellsById()['C9'];
        c9.neighbors[4] = null;
    }

    static costForCell(id) {

    }

    static getIDForRowAndColumn(row, column) {
        return RowLetters[row] + (column * 2 + ((row % 2) ? 2 : 3));
    }

    onMouseOver(cell) {
        if (!this.routing) {
            return;
        }

        // If reentering earlier in the route, prune to here
        if (this.route.containsCell(cell.id)) {
            if (this.route.lastCell().id !== cell.id) {
                if (this.route.firstCell().id === cell.id) {
                    this.startRoute(cell);
                    return;
                }
                else {
                    const index = this.route.cellIndex(cell.id);
                    const removedCells = this.route.pruneAt(index - 1);
                    _.each(removedCells,
                           cell => this.cellsById()[cell.id].tile().clearRoutedConnections(this.route.id));
                    cell.tile().clearRoutedConnections(this.route.id);
                }
            }
        }

        if (this.route.isFull()) {
            return;
        }

        // No E/E routes
        const firstCellInRoute = this.cellsById()[this.route.firstCell().id];
        if(firstCellInRoute.direction === 'e' && cell.direction === 'e') {
            return;
        }

        const lastCellInRoute = this.cellsById()[this.route.lastCell().id];

        // Find connections in the current cell which are available for routing
        const connectionsToLastCellInRoute = cell.getConnectionsToCell(lastCellInRoute);
        if (connectionsToLastCellInRoute.length === 0) {
            return;
        }

        const usedCurrentConnectionPoints = {};
        let routeableConnectionsToPrior = _.reject(connectionsToLastCellInRoute, connection => {
                const connectionPoint = connection[0] >= 0 && connection[0] < 7 ? connection[0] : connection[1];
                if (usedCurrentConnectionPoints[connectionPoint]) {
                    return true;
                }

                if (cell.tile().hasOtherRoutedConnection(connection, this.route.id)) {
                    usedCurrentConnectionPoints[connectionPoint] = true;
                    return true;
                }
            });

        if(cell.offboard && routeableConnectionsToPrior.length > 1) {
            routeableConnectionsToPrior = [_.first(routeableConnectionsToPrior)];
        }

        const cities = _(connectionsToLastCellInRoute).flatten().filter(cityId=> cityId >6).uniq().value();
        const hasOpenCity = _.find(cities, cityId=> {
            return !cell.tile().isBlockedForCompany(CurrentGame().state().currentCompanyId(), cityId);
        });

        const routeableConnectionsOnCurrent = hasOpenCity ? _.reject(cell.tile().connections, connection => {
                if(_.indexOf(cities, _.max(connection)) < 0) {
                    return true;
                }

                const connectionPoint = connection[0] >= 0 && connection[0] < 7 ? connection[0] : connection[1];
                if (usedCurrentConnectionPoints[connectionPoint]) {
                    return true;
                }

                if (cell.tile().hasOtherRoutedConnection(connection, this.route.id)) {
                    usedCurrentConnectionPoints[connectionPoint] = true;
                    return true;
                }
            }) : routeableConnectionsToPrior;

        const lastCellInRouteConnectionsToCurrent = lastCellInRoute.getConnectionsToCell(cell);
        const usedPriorConnectionPoints = {};
        const routeableConnectionsToCurrent = _.reject(lastCellInRouteConnectionsToCurrent, connection => {

            const connectionPoint = connection[0] >= 0 && connection[0] < 7 ? connection[0] : connection[1];
            if (usedPriorConnectionPoints[connectionPoint]) {
                return true;
            }

            if (lastCellInRoute.tile().hasOtherRoutedConnection(connection, this.route.id)) {
                usedPriorConnectionPoints[connectionPoint] = true;
                return true;
            }

            if (!lastCellInRoute.tile().hasRoutedConnection(connection, this.route.id)) {
                return true;
            }

        });


        if (routeableConnectionsToPrior.length === 0) {
            return;
        }
        if (routeableConnectionsToCurrent.length === 0) {
            return;
        }

        // set the correct connections in the previous tile for this route
        let lastCellConnections = [];
        if (this.route.numCells() > 1) {
            // Not a terminus for the route
            const invalidConnectionIds = _.map(lastCellInRoute.tile().getOtherRoutedConnections(this.route.id), connection=>Tile.getConnectionId(connection));
            const nextToLastCellInRoute = this.cellsById()[this.route.nextToLastCell().id];
            lastCellConnections = lastCellInRoute.getConnectionsFromNeighborToNeighbor(cell, nextToLastCellInRoute, invalidConnectionIds);
        }
        else if (lastCellInRoute.id === 'D6') {
            // Chicago is special with the many cities to one
            // Need to find the city with a station
            const routedConnections = _.filter(lastCellInRouteConnectionsToCurrent,
                                               connection => lastCellInRoute.tile().hasRoutedConnection(connection,
                                                                                                        this.route.id));

            const stationedConnection = _.find(routedConnections, connection => {
                return lastCellInRoute.tile().hasTokenForCompany(CurrentGame().state().currentCompanyId(),
                                                                 _.max(connection));
            });

            lastCellConnections = stationedConnection ? [stationedConnection] : routedConnections;
        }
        else {
            lastCellConnections = [_.first(routeableConnectionsToCurrent)];
        }

        lastCellInRoute.tile().clearRoutedConnections(this.route.id);
        _.each(lastCellConnections, connection => {
            lastCellInRoute.tile().addRoutedConnection(connection, 0, this.route.id);
        });
        this.route.updateConnections(lastCellInRoute.id, lastCellConnections);

        // Now add the connections in our current tile

        _.each(routeableConnectionsOnCurrent,
               connection => cell.tile().addRoutedConnection(connection, 0, this.route.id));

        // Add the cell to the route
        this.route.addCell(cell.id, routeableConnectionsOnCurrent);

        // Cap off the route if full
        if (this.route.isFull()) {

            const chicagoStation = cell.id === 'D6' && routeableConnectionsToPrior.length > 1;
            const connection = chicagoStation ? _.find(routeableConnectionsToPrior, connection => {
                return cell.tile().hasTokenForCompany(CurrentGame().state().currentCompanyId(),
                                                      _.max(connection))
            }) : _.first(routeableConnectionsToPrior);
            cell.tile().clearRoutedConnections(this.route.id);
            cell.tile().addRoutedConnection(connection, 0, this.route.id);
            this.route.updateConnections(cell.id, [connection]);
        }

        const valid = this.route.isValid();
        _.each(this.route.cells(),
               cell => this.cellsById()[cell.id].tile().updateRoutedConnectionsColor(this.route.id,
                                                                                     valid ? this.route.color : 0));

    }

    onMouseOut(target) {
    }

    startRoute(cell) {
        _.each(this.route.cells(), cell => this.cellsById()[cell.id].tile().clearRoutedConnections(this.route.id));
        this.route.clear();
        _.each(cell.tile().getUnroutedConnections(),
               connection => cell.tile().addRoutedConnection(connection, 0, this.route.id));
        this.route.addCell(cell.id, cell.tile().getUnroutedConnections);
    }

    onMouseDown(cell) {
        if (cell.tile().getRevenue() > 0 && this.route) {
            this.startRoute(cell);
            this.routing = true;
        }
    }

    finishRoute() {
        if (!this.routing) {
            return;
        }

        const removedCells = this.route.pruneToLastRevenueLocation();
        _.each(removedCells, cell => this.cellsById()[cell.id].tile().clearRoutedConnections(this.route.id));

        if (!this.route.isValid()) {
            _.each(this.route.cells(), cell => this.cellsById()[cell.id].tile().clearRoutedConnections(this.route.id));
            this.route.clear();
        }
        else {
            const lastCell = this.cellsById()[this.route.lastCell().id];
            const nextToLastCell = this.cellsById()[this.route.nextToLastCell().id];
            if (_.keys(lastCell.tile().cities).length > 0) {
                const priorConnections = lastCell.getConnectionsToCell(nextToLastCell);
                const usedConnectionPoints = {};
                const routeablePriorConnections = _.reject(priorConnections, connection => {
                    const connectionPoint = connection[0] >= 0 && connection[0] < 7 ? connection[0] : connection[1];
                    if (usedConnectionPoints[connectionPoint]) {
                        return true;
                    }

                    if (lastCell.tile().hasOtherRoutedConnection(connection, this.route.id)) {
                        usedConnectionPoints[connectionPoint] = true;
                        return true;
                    }
                });

                const chicagoStation = lastCell.id === 'D6' && routeablePriorConnections.length > 1;
                const connection = chicagoStation ? _.find(routeablePriorConnections, connection => {
                    return lastCell.tile().hasTokenForCompany(CurrentGame().state().currentCompanyId(),
                                                              _.max(connection))
                }) : _.first(routeablePriorConnections);
                lastCell.tile().clearRoutedConnections(this.route.id);
                lastCell.tile().addRoutedConnection(connection, this.route.color, this.route.id);
                this.route.updateConnections(lastCell.id, [connection]);
            }
        }

        this.routing = false;
    }
}

export default Grid;