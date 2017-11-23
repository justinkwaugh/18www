import BaseGrid from 'common/map/baseGrid';
import MapTileIDs from '1846/config/mapTileIds';
import _ from 'lodash';
import Cell from 'common/map/cell';
import Tile from 'common/map/tile';
import TileManifest from '1846/config/tileManifest';

const RowLetters = ['B','C','D','E','F','G','H','I','J','K'];

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

            if(row === 0 && ( col < 4 || col > 7)) {
                return;
            }

            if(row === 1 && ( col < 2 || col > 6)) {
                return;
            }

            if(row === 2 && ( col < 2 || col === 7)) {
                return;
            }

            if((row === 3 || row === 4) && col < 1 ) {
                return;
            }

            if(row === 5  && col === 9 ) {
                return;
            }

            if(row === 6  && col >7 ) {
                return;
            }

            if(row === 7  && (col === 5 || col > 6) ) {
                return;
            }

            if(row === 8  && (col < 1 || col > 3) ) {
                return;
            }

            if(row === 9  && col !== 0 ) {
                return;
            }

            return new Cell({
                id: RowLetters[row] + (col*2 + ((row % 2) ? 3 : 2)),
                top: 1 + (row *107),
                left: 2 + ((row % 2) ? 62 : 0) + col * 124
            });
        }).compact().value();

        _.each(cells, (cell)=> {
            cell.tile(TileManifest.createTile(SpecialTiles[cell.id] || MapTileIDs.BLANK));
        });

        super({ cellSize: 124, cells });

        this.cellsById()['F8'].tile(new Tile({id: 7,position: 4}));
        this.cellsById()['F10'].tile(new Tile({id: 5,position: 2}));
        this.cellsById()['E9'].tile(new Tile({id:23, position: 2}));
        this.cellsById()['D8'].tile(new Tile({id:8, position: 0}))
    }

    connectNeighbors() {

    }

}

export default Grid;