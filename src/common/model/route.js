import short from 'short-uuid';
import Serializable from 'common/model/serializable';
import Tile from 'common/map/tile';
import TrainDefinitions from '1846/config/trainDefinitions';
import _ from 'lodash';
import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';
import Events from 'common/util/events';

class Route extends Serializable {
    constructor(definition) {
        super();
        definition = definition || {};
        this.id = definition.id || short().new();
        this.color = definition.color || _.random(1, 4);
        this.companyId = definition.companyId;
        this.maxStops = definition.maxStops;
        this.revenueStops = definition.revenueStops;
        this.numStops = ko.observable(definition.numStops || 0);
        this.cells = ko.observableArray(definition.cells || []);
        this.revenue = ko.observable(definition.revenue || 0);
        if (definition.trainType) {
            this.configureForTrain(definition.trainType);
        }
    }

    configureForTrain(trainType) {
        const trainDefinition = TrainDefinitions[trainType];
        this.maxStops = trainDefinition.stops;
        this.revenueStops = trainDefinition.payingStops;
    }

    calculateRevenue() {
        const companyId = this.companyId || CurrentGame().state().currentCompanyId();
        let ewBonus = false;
        if (this.numStops() >= 2) {
            const firstStop = CurrentGame().state().tilesByCellId[this.firstCell().id];
            const lastStop = CurrentGame().state().tilesByCellId[this.lastCell().id];

            if (_([firstStop,lastStop]).map('direction').sort().join('') === 'ew') {
                ewBonus = true;
            }
        }
        const revenueData = _(this.cells()).map(cellData => {
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            return {
                hasStation: tile.hasTokenForCompany(companyId),
                revenue: tile.getRevenue(companyId, ewBonus)
            }
        }).sortBy(cellData => {
            return (cellData.hasStation ? 'b' : 'c') + '-' + (999 - cellData.revenue);
        }).value();

        let revenue = revenueData.length > 0 ? _.first(revenueData).revenue + _(revenueData).tail(revenueData).sortBy(
                'revenue').reverse().take(this.revenueStops - 1).sumBy('revenue') : 0;



        this.revenue(revenue);
    }

    isValid() {

        if (this.cells().length < 2) {
            return false;
        }

        // count revenue cells
        const companyId = this.companyId || CurrentGame().state().currentCompanyId();
        const revenueCells = _.filter(this.cells(), cellData => {
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            return tile.getRevenue(companyId);
        });

        if (revenueCells.length < 2) {
            return false;
        }

        if (revenueCells.length > 2) {
            const blocked = _.find(_.slice(revenueCells, 1, revenueCells.length - 1), cellData => {
                const cityId = this.getConnectedCityForConnections(cellData.connections);
                if (cityId < 7) {
                    return false;
                }
                const tile = CurrentGame().state().tilesByCellId[cellData.id];
                return tile.isBlockedForCompany(companyId, cityId)
            });
            if (blocked) {
                return false;
            }
        }

        return _.find(revenueCells, cellData => {
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            const cityId = _(cellData.connections).flatten().max();
            return tile.hasTokenForCompany(companyId, cityId);
        });
    }

    getConnectedCityForConnections(connections) {
        return _(connections).flatten().max();
    }

    isFull() {
        return this.numStops() === this.maxStops;
    }

    clear() {
        this.numStops(0);
        this.cells([]);
        this.calculateRevenue();
    }

    addCell(id, connections) {
        const companyId = this.companyId || CurrentGame().state().currentCompanyId();
        const tile = CurrentGame().state().tilesByCellId[id];
        if (tile.getRevenue(companyId) > 0) {
            this.numStops(this.numStops()+1);
        }
        this.cells.push({id, connections});
        this.calculateRevenue();
    }

    pruneToCell(id) {
        const index = this.cellIndex(id);
        return this.pruneAt(index);
    }

    pruneAt(index) {
        const cells = _.takeRight(this.cells(), this.numCells() - index - 1);
        _.each(cells, cell => {
            const tile = CurrentGame().state().tilesByCellId[cell.id];
            if (tile.getRevenue() > 0) {
                this.numStops(this.numStops()-1);
            }
        });
        this.cells(_.take(this.cells(), index + 1));
        this.calculateRevenue();

        return cells;
    }

    pruneToLastRevenueLocation() {
        const index = _.findLastIndex(this.cells(), cellData => {
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            return tile.getRevenue() > 0;
        });

        let pruned = [];
        if (index < 1) {
            pruned = this.cells();
            this.clear();
        }
        else {
            pruned = this.pruneAt(index);
        }

        return pruned;
    }

    numCells() {
        return this.cells().length;
    }

    containsCell(id) {
        return this.cellIndex(id) >= 0;
    }

    cellIndex(id) {
        return _.findIndex(this.cells(), cell => cell.id === id);
    }

    getCell(id) {
        return _.find(this.cells(), cell => cell.id === id);
    }

    firstCell() {
        return _.first(this.cells());
    }

    lastCell() {
        return _.last(this.cells());
    }

    nextToLastCell() {
        return _.nth(this.cells(), this.numCells() - 2);
    }

    updateConnections(cellId, connections) {
        const cell = this.getCell(cellId);
        cell.connections = connections;
    }

    upgradeConnections(cellId, oldTile, newTile) {
        const cell = this.getCell(cellId);
        if(!cell) {
            return;
        }
        const upgradedConnectionsById = oldTile.getUpgradedConnections(newTile);

        cell.connections = _.map(cell.connections, connection=> {
            const connectionId = Tile.getConnectionId(connection);
            return upgradedConnectionsById[connectionId];
        });
        this.calculateRevenue(this.companyId);
    }
}

Route.registerClass();

export default Route;