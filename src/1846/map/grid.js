import BaseGrid from 'common/map/baseGrid';
import _ from 'lodash';
import Cell from 'common/map/cell';
import Tile from 'common/map/tile';

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
                left: 3 + ((row % 2) ? 62 : 0) + col * 124
            });
        }).compact().value();



        super({ cellSize: 124, cells });

        const cell = this.cellsById()['F10'];
        cell.tile(new Tile({id: 9}));

        const cell2 = this.cellsById()['F8'];
        cell2.tile(new Tile({id: 8}));

        const cell3 = this.cellsById()['F6'];
        cell3.tile(new Tile({id: 57}));

    }

}

export default Grid;