import ko from 'knockout';
import _ from 'lodash';
import Serializable from 'common/model/serializable';
import CurrentGame from 'common/game/currentGame';
import PhaseIDs from '1846/config/phaseIds';
import RouteColors from '1846/config/routeColors';
import TileManifest from '1846/config/tileManifest';
import OffBoardIDs from '1846/config/offBoardIds';
import MapTileIDs from '1846/config/mapTileIds';

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
        this.map = data.map;
        this.colorId = data.colorId;
        this.connections = data.connections || [];
        this.cities = data.cities || {};
        this.upgrades = data.upgrades || [];
        this.revenue = data.revenue || 0;
        this.direction = data.direction || '';
        this.ewBonus = data.ewBonus || 0;

        // Dynamic data
        this.position = ko.observable(data.position || 0);
        this.tokens = ko.observableArray(data.tokens || []);
        this.reservedTokens = ko.observableArray(data.reservedTokens);

        this.hasMeat = ko.observable(data.hasMeat);
        this.hasSteamboat = ko.observable(data.hasSteamboat);

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
        this.reservedTokensPerCity = ko.computed(() => {
            const tokensPerCity = {};
            _.each(this.reservedTokens(), token => {
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

    copyToTile(newTile) {
        newTile.tokens(_.clone(this.tokens()));
        newTile.reservedTokens(this.reservedTokens());
        newTile.hasMeat(this.hasMeat());
        newTile.hasSteamboat(this.hasSteamboat());
    }

    toJSON() {
        const plainObject = super.toJSON();
        delete plainObject.routedConnectionsById;
        return plainObject;
    }

    getRevenue(cellId, companyId, ewBonus) {
        let revenue = 0;
        if (this.hasMeat() && this.hasMeat() === companyId) {
            revenue += 30;
        }

        if (this.hasSteamboat() && this.hasSteamboat() === companyId) {
            revenue += (cellId === 'G19' || cellId === OffBoardIDs.HOLLAND) ? 40 : 20;
        }

        if (_.isArray(this.revenue)) {
            const phaseId = CurrentGame().state().currentPhaseId();
            if (phaseId === PhaseIDs.PHASE_I) {
                revenue += this.revenue[0];
            }
            else if (phaseId === PhaseIDs.PHASE_II) {
                revenue += this.revenue[1];
            }
            else if (phaseId === PhaseIDs.PHASE_III) {
                revenue += this.revenue[2];
            }
            else if (phaseId === PhaseIDs.PHASE_IV) {
                revenue += this.revenue[3];
            }
        }
        else {
            revenue += this.revenue;
        }

        if (ewBonus) {
            revenue += this.ewBonus || 0;
        }

        return revenue;
    }

    getTokensForCity(cityId) {
        return this.tokensPerCity()[cityId] || [];
    }

    getReservedTokensForCity(cityId) {
        return this.reservedTokensPerCity()[cityId] || [];
    }

    getReservedTokenForCompany(companyId) {
        const cityId = _.findKey(this.reservedTokensPerCity(), tokens => _.indexOf(tokens, companyId) >= 0);
        return cityId ? cityId + '|' + companyId : null;
    }

    hasReservedTokenForCompany(companyId, cityId) {
        if (cityId) {
            return _.indexOf(this.getReservedTokensForCity(cityId), companyId) >= 0;
        }
        else {
            return _(this.reservedTokensPerCity()).values().flatten().indexOf(companyId) >= 0;
        }
    }

    addReservedToken(companyId, cityId) {
        if (!cityId) {
            const cities = _.values(this.cities);
            if (cities.length === 1) {
                cityId = cities[0].id;
            }
        }
        if (!this.hasReservedTokenForCompany(companyId, cityId)) {
            this.reservedTokens.push(cityId + '|' + companyId);
        }
    }

    removeReservedToken(companyId, cityId) {
        const token = cityId ? cityId + '|' + companyId : this.getReservedTokenForCompany(companyId);
        const removed = this.reservedTokens.remove(token);
        return removed.length > 0 ? removed[0] : null;
    }

    addToken(companyId, cityId) {
        if (!cityId) {
            const cities = _.values(this.cities);
            if (cities.length === 1) {
                cityId = cities[0].id;
            }
        }
        if (!this.hasTokenForCompany(companyId, cityId)) {
            this.tokens.push(cityId + '|' + companyId);
        }
    }

    removeToken(companyId, cityId) {
        const token = cityId ? cityId + '|' + companyId : this.getTokenForCompany(companyId);
        const removed = this.tokens.remove(token);
        return removed.length > 0 ? removed[0] : null;
    }

    hasCity() {
        return _.keys(this.cities).length > 0;
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
            const otherReserved = _.reject(this.getReservedTokensForCity(cityId),
                                           reservedToken => reservedToken === companyId);
            return city.maxTokens > (this.getTokensForCity(cityId).length + otherReserved.length) ? city.id : null;
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

    getTokenForCompany(companyId) {
        const cityId = _.findKey(this.tokensPerCity(), tokens => _.indexOf(tokens, companyId) >= 0);
        return cityId ? cityId + '|' + companyId : null;
    }

    isBlockedForCompany(companyId, cityId) {
        return !this.hasTokenForCompany(companyId, cityId) && this.getTokensForCity(
                cityId).length === this.cities[cityId].maxTokens;
    }

    hasConnection(start, end) {
        return _.find(this.connections, connection => connection[0] === start && connection[1] === end);
    }

    getConnectionsToPoint(point) {
        return _.filter(this.connections, connection => connection[0] === point || connection[1] === point);
    }

    static getConnectionId(connection) {
        return Math.min(connection[0], connection[1]) + '-' + Math.max(connection[0], connection[1]);
    }

    getUpgradedConnections(newTile) {
        const oldConnectionsIds = Tile.getConnectionIdsForPosition(this.id, this.position());
        const newConnectionsIds = Tile.getConnectionIdsForPosition(newTile.id, newTile.position());
        const newConnectionsById = _.fromPairs(_.zip(newConnectionsIds, newTile.connections));
        const originalConnectionIds = _.map(this.connections, connection => Tile.getConnectionId(connection));
        const upgradedConnections = _(oldConnectionsIds).map(connectionId => newConnectionsById[connectionId]).value();
        return _.zipObject(originalConnectionIds, upgradedConnections);
    }

    static getConnectionsForPosition(tileId, position) {
        return _.map(TileManifest.getTileDefinition(tileId).connections, (connection) => {
            const newStart = Tile.getOffsetIndexForPosition(connection[0], position);
            const newEnd = Tile.getOffsetIndexForPosition(connection[1], position);
            return [newStart, newEnd];
        });
    }

    static getConnectionIdsForPosition(tileId, position) {
        return _.map(Tile.getConnectionsForPosition(tileId, position), (connection) => {
            return Tile.getConnectionId(connection);
        });
    }

    static getOffsetIndexForPosition(index, position) {
        return index < 7 ? (index + position) % 6 : index;
    }

    getRoutedCityColors(cityId) {
        cityId = cityId || 7;
        return _(this.getRoutedConnections()).filter(
            connection => Math.max(connection[0], connection[1]) === cityId).map(connection => {
            const connectionId = Tile.getConnectionId(connection);
            return RouteColors[this.routedConnectionsById()[connectionId].color];
        }).uniq().value();
    }

    getRoutedConnection(connection) {
        const connectionId = Tile.getConnectionId(connection);
        return this.routedConnectionsById()[connectionId];
    }

    getRoutedConnections() {
        return _(this.connections).filter(connection => {
            return this.getRoutedConnection(connection);
        }).value();
    }

    getOtherRoutedConnections(routeId) {
        return _(this.connections).filter(connection => {
            return this.hasOtherRoutedConnection(connection, routeId);
        }).value();
    }

    getUnroutedConnections() {
        return _(this.connections).reject(connection => {
            const connectionId = Tile.getConnectionId(connection);
            return this.routedConnectionsById()[connectionId];
        }).value();
    }

    hasRoutedConnection(connection, routeId) {
        const connectionId = Tile.getConnectionId(connection);
        const routedConnection = this.routedConnectionsById()[connectionId];
        return routedConnection && (!routeId || routedConnection.routeId === routeId);
    }

    hasOtherRoutedConnection(connection, routeId) {
        const connectionId = Tile.getConnectionId(connection);
        const routedConnection = this.routedConnectionsById()[connectionId];
        return routedConnection && routedConnection.routeId !== routeId;
    }

    addRoutedConnection(connection, color, routeId) {
        const connectionId = Tile.getConnectionId(connection);
        this.routedConnectionsById.valueWillMutate();
        this.routedConnectionsById()[connectionId] = {color, routeId};
        this.routedConnectionsById.valueHasMutated();
    }

    removeRoutedConnection(connection) {
        const connectionId = Tile.getConnectionId(connection);
        this.routedConnectionsById.valueWillMutate();
        delete this.routedConnectionsById()[connectionId];
        this.routedConnectionsById.valueHasMutated();
    }

    clearRoutedConnections(routeId) {
        this.routedConnectionsById.valueWillMutate();
        if (!routeId) {
            this.routedConnectionsById({});
        }
        else {
            this.routedConnectionsById(
                _.pickBy(this.routedConnectionsById(), connectionData => connectionData.routeId !== routeId));
        }
        this.routedConnectionsById.valueHasMutated();
    }

    updateRoutedConnectionsColor(routeId, color) {
        this.routedConnectionsById.valueWillMutate();
        _(this.routedConnectionsById()).values().filter(connectionData => connectionData.routeId === routeId).each(
            connectionData => {
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
        const connectionId = Tile.getConnectionId(connection);
        const connectionData = this.routedConnectionsById()[connectionId];
        return connectionData ? RouteColors[connectionData.color] : 'white';
    }

    getOuterStrokeWidth(connection) {
        const connectionId = Tile.getConnectionId(connection);
        return this.routedConnectionsById()[connectionId] ? 21 : 13;
    }

    getCityDashArray(cityId) {
        const num = this.getRoutedCityColors(cityId).length;
        if (num === 2) {
            return '40 40 40 40';
        }
        else if (num === 3) {
            return '33 66 33 66';
        }
        else if (num === 4) {
            return '20 60 20 60'
        }

        return '';
    }

    getCityDashOffset(cityId) {
        const num = this.getRoutedCityColors(cityId).length;
        if (num === 2) {
            return '40';
        }
        else if (num === 3) {
            return '33';
        }
        else if (num === 4) {
            return '20'
        }

        return '';
    }

    getCityOuterStrokeColor(cityId) {
        const routedConnectionId = _(this.connections).filter(
            connection => connection[1] === cityId || connection[0] === cityId).map(
            connection => Tile.getConnectionId(connection)).find(
            connectionId => this.routedConnectionsById()[connectionId]);
        return routedConnectionId ? RouteColors[this.routedConnectionsById()[routedConnectionId].color] : 'white';

    }

    getCityOuterStrokeWidth(cityId) {
        const routed = _(this.connections).filter(
            connection => connection[1] === cityId || connection[0] === cityId).map(
            connection => Tile.getConnectionId(connection)).find(
            connectionId => this.routedConnectionsById()[connectionId]);
        return routed ? 8 : 1;
    }

    getCityName(cityId) {
        if (this.id !== MapTileIDs.CHICAGO) {
            return '';
        }

        if (cityId === 7) {
            return 'North';
        }
        if (cityId === 8) {
            return 'East';
        }
        if (cityId === 9) {
            return 'SE';
        }
        if (cityId === 10) {
            return 'SW';
        }
    }

}

Tile.registerClass();

export default Tile;