import BaseGrid from 'common/map/baseGrid';
import MapTileIDs from '1846/config/mapTileIds';
import _ from 'lodash';
import Cell from 'common/map/cell';
import Tile from 'common/map/tile';
import TileManifest from '1846/config/tileManifest';

const RowLetters = ['A','B','C','D','E','F','G','H','I','J','K'];

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
    C9 : MapTileIDs.CITY,
    C15 : MapTileIDs.DETROIT,
    D6 : MapTileIDs.CHICAGO,
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
    I5: MapTileIDs.CENTRALIA
};

class Grid extends BaseGrid {
    constructor(data) {
        const cells = _(_.range(0,10*12)).map((value) => {
            const row = Math.floor(value/12);
            const col = value % 10;

            if(row === 0) {
                return
            }

            if(row === 1 && ( col < 4 || col > 7)) {
                return;
            }

            if(row === 2 && ( col < 2 || col > 6)) {
                return;
            }

            if(row === 3 && ( col < 2 || col === 7)) {
                return;
            }

            if((row === 4 || row === 5) && col < 1 ) {
                return;
            }

            if(row === 6  && col === 9 ) {
                return;
            }

            if(row === 7  && col >7 ) {
                return;
            }

            if(row === 8  && (col === 5 || col > 6) ) {
                return;
            }

            if(row === 9  && (col < 1 || col > 3) ) {
                return;
            }

            if(row === 10  && col !== 0 ) {
                return;
            }

            return new Cell({
                id: Grid.getIDForRowAndColumn(row, col),
                row,
                col,
                top: 1 + ((row-1) *107),
                left: 2 + (((row-1) % 2) ? 62 : 0) + col * 124
            });
        }).compact().value();

        _.each(cells, (cell)=> {
            cell.tile(TileManifest.createTile(SpecialTiles[cell.id] || MapTileIDs.BLANK));
        });

        super({ cellSize: 124, cells });

        this.connectNeighbors();
    }

    connectNeighbors() {
        _.each(this.cells(), (cell)=> {
            cell.neighbors[0] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row-1, cell.col + (cell.row %2 ? 0 : 1))];
            cell.neighbors[1] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row, cell.col + 1)];
            cell.neighbors[2] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row+1, cell.col + (cell.row %2 ? 0 : 1))];
            cell.neighbors[3] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row+1, cell.col - (cell.row %2 ? 1 : 0))];
            cell.neighbors[4] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row, cell.col - 1)];
            cell.neighbors[5] = this.cellsById()[Grid.getIDForRowAndColumn(cell.row-1, cell.col - (cell.row %2 ? 1 : 0))];
            // console.log('Cell ' + cell.id + ' Neighbors: [' + (cell.neighbors[0] ? cell.neighbors[0].id : 'None') + ',' +
            //        (cell.neighbors[1] ? cell.neighbors[1].id : 'None') + ',' +
            //        (cell.neighbors[2] ? cell.neighbors[2].id : 'None') + ',' +
            //        (cell.neighbors[3] ? cell.neighbors[3].id : 'None') + ',' +
            //        (cell.neighbors[4] ? cell.neighbors[4].id : 'None') + ',' +
            //        (cell.neighbors[5] ? cell.neighbors[5].id : 'None') + ']');
        });
    }

    static getIDForRowAndColumn(row, column) {
        return RowLetters[row] + (column*2 + ((row % 2) ? 2 : 3));
    }

}

export default Grid;