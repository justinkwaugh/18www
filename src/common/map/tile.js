import ko from 'knockout';
import _ from 'lodash';
import Serializable from 'common/model/serializable';

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

class Tile extends Serializable {
    constructor(data) {
        super();
        data = data || {};

        this.id = data.id;

        // Static data from tile definition
        this.colorId = data.colorId;
        this.connections = data.connections || [];
        this.cities = data.cities || {};
        this.upgrades = data.upgrades || [];
        this.revenue = data.revenue || 0;

        // Dynamic data
        this.position = ko.observable(data.position || 0);
        this.tokens = ko.observableArray(data.tokens || []);
        this.tokensPerCity = ko.computed(() => {
            const tokensPerCity = {};
            _.each(this.tokens(), token => {
                const splitToken = token.split('|');
                const tokenArray = tokensPerCity[splitToken[0]] || [];
                tokenArray.push(splitToken[1]);
                tokensPerCity[splitToken[0]] = tokenArray;
            });
            return tokensPerCity;
        });
    }

    getTokensForCity(cityId) {
        return this.tokensPerCity()[cityId] || [];
    }

    addToken(companyId, cityId) {
        if (!cityId) {
            debugger;
            const cities = _.values(this.cities);
            if (cities.length === 1) {
                cityId = cities[0].id;
            }
        }
        this.tokens.push(cityId + '|' + companyId);
    }

    removeToken(companyId, cityId) {
        if (!cityId) {
            const cities = _.values(this.cities);
            if (cities.length === 1) {
                cityId = cities[0].id;
            }
        }
        this.tokens.remove(cityId + '|' + companyId);
    }

    getOpenCities(companyId) {
        const cities = _.values(this.cities);
        if (cities.length === 0) {
            return [];
        }

        if (_.find(this.tokens(), token => _.endsWith(token, companyId))) {
            return [];
        }

        return _(this.tokensPerCity()).map((companies, cityId) => {
            const self = this;
            return this.cities[cityId].maxTokens > companies.length ? cityId : null;
        }).compact().value();
    }

    hasTokenForCompany(companyId, cityId) {
        if(cityId) {
            return _.indexOf(this.getTokensForCity(cityId), companyId) >= 0;
        }
        else {
            return _(this.tokensPerCity()).values().flatten().indexOf(companyId) >= 0;
        }
    }

    hasConnection(start, end) {
        return _.find(this.connections, connection => connection[0] === start && connection[1] === end);
    }

    getConnectionsToPoint(point) {
        return _.filter(this.connections, connection => connection[0] === point || connection[1] === point);
    }

    getDrawingInstructions(connection) {
        if (connection[1] > 6 || (connection[1] - connection[0] === 3)) {
            return 'M ' + EdgeCoordinates[connection[0]] + ' L ' + EdgeCoordinates[connection[1]];
        }
        else {
            return 'M ' + EdgeCoordinates[connection[0]] + ' C ' + (CurveControls[connection[0] + '-' + connection[1]] || '0,0 0,0') + ' ' + EdgeCoordinates[connection[1]];
        }
    }
}

Tile.registerClass();

export default Tile;