import ko from 'knockout';
import _ from 'lodash';

const EdgeCoordinates = [
 '31,-53.69',
 '62,0',
 '31,53.69',
 '-31,53.69',
 '-62,0',
 '-31,-53.69',
 '0,0',
 '0,0'
];

const CurveControls = {
    '0-1': '17.22,-29.83 34.45,0',
    '0-2': '11.82,-20.47 11.82,20.47',
    '0-4': '11.82,-20.47 -23.64,0',
    '0-5': '17.22,-29.83 -17.22,-29.83',
    '1-2': '34.45,0 17.22,29.83',
    '1-3': '23.64,0 -11.82,20.47',
    '1-5': '23.64,0 -11.82,-20.47',
    '2-3': '17.22,29.83 -17.22,29.83',
    '2-4': '11.82,20.47 -23.64,0',
    '3-4': '-17.22,29.83 -34.45,0',
    '3-5': '-11.82,20.47 -11.82,-20.47'
};

class Tile {
    constructor(data) {
        data = data || {};

        this.id = data.id;
        this.colorId = data.colorId;

        this.position = ko.observable(data.position || 0);
        this.connections = data.connections || [];
        this.upgrades = data.upgrades || [];

        this.revenue = data.revenue || 0;
        this.maxTokens = data.maxTokens || 0;
        this.tokens = ko.observableArray(data.tokens || []);
    }

    hasConnection(start,end) {
        return _.find(this.connections, connection => connection[0] === start && connection[1] === end);
    }

    getDrawingInstructions(connection) {
        if(connection[1] > 6 || (connection[1] - connection[0] === 3)) {
            return 'M ' + EdgeCoordinates[connection[0]] + ' L ' + EdgeCoordinates[connection[1]];
        }
        else {
            return 'M ' + EdgeCoordinates[connection[0]] + ' C ' + (CurveControls[connection[0] + '-' + connection[1]] || '0,0 0,0') + ' ' + EdgeCoordinates[connection[1]];
        }
    }
}

export default Tile;