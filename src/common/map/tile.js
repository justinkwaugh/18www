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

        // Not serialized
        this.routedConnectionsById = ko.observable(data.routedConnectionsById || {});
    }

    toJSON() {
        const plainObject = super.toJSON();
        delete plainObject.routedConnectionsById;
        return plainObject;
    }

    getRevenue() {
        return this.revenue;
    }

    getTokensForCity(cityId) {
        return this.tokensPerCity()[cityId] || [];
    }

    addToken(companyId, cityId) {
        if (!cityId) {
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

        return _(this.cities).map((city, cityId) => {
            return city.maxTokens > this.getTokensForCity(cityId).length ? city.id : null;
        }).compact().value();
    }

    hasTokenForCompany(companyId, cityId) {
        if (cityId) {
            return _.indexOf(this.getTokensForCity(cityId), companyId) >= 0;
        }
        else {
            return _(this.tokensPerCity()).values().flatten().indexOf(companyId) >= 0;
        }
    }

    isBlockedForCompany(companyId, cityId) {
        return !this.hasTokenForCompany(companyId, cityId) && this.getTokensForCity(cityId).length === this.cities[cityId].maxTokens;
    }

    hasConnection(start, end) {
        return _.find(this.connections, connection => connection[0] === start && connection[1] === end);
    }

    getConnectionsToPoint(point) {
        return _.filter(this.connections, connection => connection[0] === point || connection[1] === point);
    }

    getConnectionId(connection) {
        return Math.min(connection[0], connection[1]) + '-' + Math.max(connection[0], connection[1]);
    }

    getRoutedConnections() {
        return _(this.connections).filter(connection=> {
            const connectionId = this.getConnectionId(connection);
            return this.routedConnectionsById()[connectionId];
        }).value();
    }

    getUnroutedConnections() {
        return _(this.connections).reject(connection=> {
            const connectionId = this.getConnectionId(connection);
            return this.routedConnectionsById()[connectionId];
        }).value();
    }

    hasRoutedConnection(connection, routeId) {
        const connectionId = this.getConnectionId(connection);
        const routedConnection = this.routedConnectionsById()[connectionId];
        return routedConnection && routedConnection.routeId === routeId;
    }

    hasOtherRoutedConnection(connection, routeId) {
        const connectionId = this.getConnectionId(connection);
        const routedConnection = this.routedConnectionsById()[connectionId];
        return routedConnection && routedConnection.routeId !== routeId;
    }

    addRoutedConnection(connection, color, routeId) {
        const connectionId = this.getConnectionId(connection);
        this.routedConnectionsById.valueWillMutate();
        this.routedConnectionsById()[connectionId] = { color, routeId };
        this.routedConnectionsById.valueHasMutated();
    }

    removeRoutedConnection(connection) {
        const connectionId = this.getConnectionId(connection);
        this.routedConnectionsById.valueWillMutate();
        delete this.routedConnectionsById()[connectionId];
        this.routedConnectionsById.valueHasMutated();
    }

    clearRoutedConnections(routeId) {
        this.routedConnectionsById.valueWillMutate();
        if(!routeId) {
            this.routedConnectionsById({});
        }
        else {
            this.routedConnectionsById(_.pickBy(this.routedConnectionsById(), connectionData=> connectionData.routeId !== routeId));
        }
        this.routedConnectionsById.valueHasMutated();
    }

    updateRoutedConnectionsColor(routeId, color) {
        this.routedConnectionsById.valueWillMutate();
        _(this.routedConnectionsById()).values().filter(connectionData => connectionData.routeId === routeId).each(connectionData=> {
            connectionData.color = color;
        });
        this.routedConnectionsById.valueHasMutated();
    }

    getDrawingInstructions(connection) {
        if (connection[1] > 6 || (connection[1] - connection[0] === 3)) {
            return 'M ' + EdgeCoordinates[connection[0]] + ' L ' + EdgeCoordinates[connection[1]];
        }
        else {
            return 'M ' + EdgeCoordinates[connection[0]] + ' C ' + (CurveControls[connection[0] + '-' + connection[1]] || '0,0 0,0') + ' ' + EdgeCoordinates[connection[1]];
        }
    }

    getOuterStrokeColor(connection) {
        const connectionId = this.getConnectionId(connection);
        const connectionData = this.routedConnectionsById()[connectionId];
        return connectionData ? connectionData.color : 'white';
    }

    getOuterStrokeWidth(connection) {
        const connectionId = this.getConnectionId(connection);
        return this.routedConnectionsById()[connectionId] ? 21 : 13;
    }

    getCityOuterStrokeColor(cityId) {
        const routedConnectionId = _(this.connections).filter(connection => connection[1] === cityId || connection[0] === cityId).map(
            connection => this.getConnectionId(connection)).find(connectionId=>this.routedConnectionsById()[connectionId]);
        return routedConnectionId ? this.routedConnectionsById()[routedConnectionId].color : 'white';

    }

    getCityOuterStrokeWidth(cityId) {
        const routed = _(this.connections).filter(connection => connection[1] === cityId || connection[0] === cityId).map(
            connection => this.getConnectionId(connection)).find(connectionId=>this.routedConnectionsById()[connectionId]);
        return routed ? 8 : 1;
    }

}

Tile.registerClass();

export default Tile;