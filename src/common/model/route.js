import short from 'short-uuid';
import Serializable from 'common/model/serializable';
import TrainDefinitions from '1846/config/trainDefinitions';
import _ from 'lodash';
import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';

class Route extends Serializable {
    constructor(definition) {
        super();
        definition = definition || {};
        this.id = definition.id || short().new();
        this.color = definition.color || (_.random(0,1) ? 'red': 'blue');
        this.companyId = definition.companyId;
        this.maxStops = definition.maxStops;
        this.revenueStops = definition.revenueStops;
        this.numStops = definition.numStops;
        this.cells = ko.observableArray(definition.cells || []);
        this.revenue = ko.observable(definition.revenue || 0);
        if(definition.trainType) {
            this.configureForTrain(definition.trainType);
        }
    }

    configureForTrain(trainType) {
        const trainDefinition = TrainDefinitions[trainType];
        this.maxStops = trainDefinition.stops;
        this.revenueStops = trainDefinition.payingStops;
    }

    calculateRevenue() {

        const revenueData = _(this.cells()).map(cellData => {
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            return {
                hasStation: tile.hasTokenForCompany(CurrentGame().state().currentCompanyId()),
                revenue: tile.getRevenue()
            }
        }).sortBy(cellData => {
            return (cellData.hasStation? 'b' : 'c') + '-' + (999 - cellData.revenue);
        }).value();

        const revenue = revenueData.length > 0 ? _.first(revenueData).revenue + _(revenueData).tail(revenueData).sortBy('revenue').reverse().take(this.revenueStops-1).sumBy('revenue') : 0;
        this.revenue(revenue);
    }

    isValid() {
        if(this.cells().length < 2) {
            return false;
        }

        // count revenue cells
        const revenueCells = _.filter(this.cells(), cellData=> {
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            return tile.getRevenue();
        });

        if(revenueCells.length < 2) {
            return false;
        }

        const blocked =_.find(revenueCells, cellData=> {
            const cityId = this.getConnectedCityForConnections(cellData.connections);
            if(cityId < 7) {
                return false;
            }
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            return tile.isBlockedForCompany(CurrentGame().state().currentCompanyId(),cityId)
        });

        if(blocked) {
            return false;
        }

        return _.find(revenueCells, cellData=> {
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            const cityId = _(cellData.connections).flatten().max();
            return tile.hasTokenForCompany(CurrentGame().state().currentCompanyId(), cityId);
        });
    }

    getConnectedCityForConnections(connections) {
        return _(connections).flatten().max();
    }

    isFull() {
        return this.numStops === this.maxStops;
    }

    clear() {
        this.numStops = 0;
        this.cells([]);
        this.calculateRevenue();
    }

    addCell(id, connections) {
        const tile = CurrentGame().state().tilesByCellId[id];
        if (tile.getRevenue() > 0) {
            this.numStops += 1;
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
                this.numStops -= 1;
            }
        });
        this.cells(_.take(this.cells(), index + 1));
        this.calculateRevenue();

        return cells;
    }

    pruneToLastRevenueLocation() {
        const index = _.findLastIndex(this.cells(), cellData=> {
            const tile = CurrentGame().state().tilesByCellId[cellData.id];
            return tile.getRevenue() > 0;
        });

        let pruned = [];
        if(index < 1) {
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
}

Route.registerClass();

export default Route;