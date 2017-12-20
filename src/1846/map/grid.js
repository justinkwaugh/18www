import BaseGrid from 'common/map/baseGrid';
import MapTileIDs from '1846/config/mapTileIds';
import _ from 'lodash';
import Cell from 'common/map/cell';
import OffBoardCell from '1846/map/offBoardCell';
import Tile from 'common/map/tile';
import TileManifest from '1846/config/tileManifest';
import Events from 'common/util/events';
import CurrentGame from 'common/game/currentGame';

const RowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

const OffBoardIds = {
    CHICAGO_CONNECTIONS: 'chicago_connections',
    ST_LOUIS: 'st_louis',
    HOLLAND: 'holland',
    SARNIA: 'sarnia',
    WINDSOR: 'windsor',
    LOUISVILLE: 'louisville',
    CHARLESTON: 'charleston',
    BUFFALO: 'buffalo',
    BINGHAMTON: 'binghamton',
    PITTSBURGH: 'pittsburgh',
    CUMBERLAND: 'cumberland'
};

const SpecialTiles = {
    A15: MapTileIDs.A15,
    B16: MapTileIDs.CITY,
    C7: MapTileIDs.C7,
    C9: MapTileIDs.CITY,
    C15: MapTileIDs.DETROIT,
    D6: MapTileIDs.CHICAGO,
    D14: MapTileIDs.CITY,
    D20: MapTileIDs.ERIE,
    E11: MapTileIDs.CITY,
    E17: MapTileIDs.CLEVELAND,
    G3: MapTileIDs.CITY,
    G7: MapTileIDs.CITY,
    G9: MapTileIDs.CITY,
    G13: MapTileIDs.CITY,
    G15: MapTileIDs.CITY,
    G19: MapTileIDs.WHEELING,
    H12: MapTileIDs.CINCINNATI,
    I5: MapTileIDs.CENTRALIA,
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

const TerrainTypes = {
    BRIDGE: 'bridge',
    TUNNEL: 'tunnel'
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
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['D6|2']
    },
    [OffBoardIds.ST_LOUIS]: {
        id: OffBoardIds.ST_LOUIS,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['H2|0', 'I3|1']
    },
    [OffBoardIds.HOLLAND]: {
        id: OffBoardIds.HOLLAND,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['B10|1']
    },
    [OffBoardIds.SARNIA]: {
        id: OffBoardIds.SARNIA,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['B16|4'],
        connectionCosts: ConnectionCosts[OffBoardIds.SARNIA]
    },
    [OffBoardIds.WINDSOR]: {
        id: OffBoardIds.WINDSOR,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['C15|4'],
        connectionCosts: ConnectionCosts[OffBoardIds.WINDSOR]
    },
    [OffBoardIds.LOUISVILLE]: {
        id: OffBoardIds.LOUISVILLE,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['I9|5', 'I11|0']
    },
    [OffBoardIds.CHARLESTON]: {
        id: OffBoardIds.CHARLESTON,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['I15|4']
    },
    [OffBoardIds.BUFFALO]: {
        id: OffBoardIds.BUFFALO,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['D20|3', 'D20|4']
    },
    [OffBoardIds.BINGHAMTON]: {
        id: OffBoardIds.BINGHAMTON,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['E21|4']
    },
    [OffBoardIds.PITTSBURGH]: {
        id: OffBoardIds.PITTSBURGH,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['F20|4', 'F20|5', 'G19|4'],
        connectionCosts: ConnectionCosts[OffBoardIds.WINDSOR]
    },
    [OffBoardIds.CUMBERLAND]: {
        id: OffBoardIds.CUMBERLAND,
        top: 0,
        left: 0,
        row: 0,
        col: 0,
        connections: ['G19|5']
    }
};

class Grid extends BaseGrid {
    constructor(state) {
        const cells = _(_.range(0, 10 * 12)).map((value) => {
            const row = Math.floor(value / 12);
            const col = value % 10;

            if (row === 0 && (col !== 6)) {
                return
            }

            if (row === 1 && ( col < 4 || col > 7)) {
                return;
            }

            if (row === 2 && ( col < 2 || col > 6)) {
                return;
            }

            if (row === 3 && ( col < 2 || col === 7)) {
                return;
            }

            if ((row === 4 || row === 5) && col < 1) {
                return;
            }

            if (row === 6 && col === 9) {
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
                                top: 1 + ((row - 1) * 107),
                                left: 2 + (((row - 1) % 2) ? 62 : 0) + col * 124,
                                connectionCosts: ConnectionCosts[id]
                            });
        }).compact().value();

        const offBoardCells = _.map(OffBoardIds, offBoardId => {
            return new OffBoardCell(OffBoardDefinitions[offBoardId]);
        });

        const allCells = _.concat(cells, offBoardCells);

        _.each(allCells, (cell) => {
            const tile = TileManifest.createTile(SpecialTiles[cell.id] || MapTileIDs.BLANK);
            state.tilesByCellId[cell.id] = tile;
            cell.tile(tile);
        });

        super({cellSize: 124, cells: allCells});

        this.connectNeighbors();


        Events.on('stateUpdated', () => {
            _.each(CurrentGame().state().tilesByCellId, (tile, cellId) => {
                this.cellsById()[cellId].tile(tile);
            });
        });
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
        b10.neighbors[4] = this.cellsById()[OffBoardIds.HOLLAND];

        const chicago = this.cellsById()['D6'];
        chicago.neighbors[5] = this.cellsById()[OffBoardIds.CHICAGO_CONNECTIONS];

        const h2 = this.cellsById()['H2'];
        h2.neighbors[3] = this.cellsById()[OffBoardIds.ST_LOUIS];

        const i3 = this.cellsById()['I3'];
        i3.neighbors[4] = this.cellsById()[OffBoardIds.ST_LOUIS];

        const b16 = this.cellsById()['B16'];
        b16.neighbors[1] = this.cellsById()[OffBoardIds.SARNIA];

        const c15 = this.cellsById()['C15'];
        c15.neighbors[1] = this.cellsById()[OffBoardIds.WINDSOR];

        const d20 = this.cellsById()['D20'];
        d20.neighbors[0] = this.cellsById()[OffBoardIds.BUFFALO];
        d20.neighbors[1] = this.cellsById()[OffBoardIds.BUFFALO];

        const e21 = this.cellsById()['E21'];
        e21.neighbors[1] = this.cellsById()[OffBoardIds.BINGHAMTON];

        const f20 = this.cellsById()['F20'];
        f20.neighbors[1] = this.cellsById()[OffBoardIds.PITTSBURGH];
        f20.neighbors[2] = this.cellsById()[OffBoardIds.PITTSBURGH];

        const g19 = this.cellsById()['G19'];
        g19.neighbors[1] = this.cellsById()[OffBoardIds.PITTSBURGH];
        g19.neighbors[2] = this.cellsById()[OffBoardIds.CUMBERLAND];

        const i15 = this.cellsById()['I15'];
        i15.neighbors[1] = this.cellsById()[OffBoardIds.CHARLESTON];

        const i9 = this.cellsById()['I9'];
        i9.neighbors[2] = this.cellsById()[OffBoardIds.LOUISVILLE];

        const i11 = this.cellsById()['I11'];
        i11.neighbors[3] = this.cellsById()[OffBoardIds.LOUISVILLE];
    }

    static costForCell(id) {

    }

    static getIDForRowAndColumn(row, column) {
        return RowLetters[row] + (column * 2 + ((row % 2) ? 2 : 3));
    }

}

export default Grid;