import ko from 'knockout';
import _ from 'lodash';
import CurrentGame from 'common/game/currentGame';
import CompanyIDs from '1846/config/companyIds';
import StartCompany from '1846/actions/startCompany';
import Prices from '1846/config/prices';
import Serializable from 'common/model/serializable';


class Company extends Serializable {
    constructor(definition) {
        super();
        definition = definition || {};
        this.id = definition.id;
        this.name = definition.name || 'Anonymous';
        this.nickname = definition.nickname || 'Anon';
        this.type = definition.type;
        this.homeCellId = definition.homeCellId;

        this.certificates = ko.observableArray(definition.certificates);
        this.shares = ko.computed(() => {
            return _.sumBy(this.certificates(), 'shares');
        });
        this.cash = ko.observable(definition.cash || 0);
        this.tokens = ko.observable(definition.tokens || 0);
        this.startTokens = definition.startTokens;
        this.privates = ko.observableArray(definition.privates || []);
        this.trains = ko.observableArray(definition.trains || []);
        this.president = ko.observable(definition.president);
        this.parPriceIndex = ko.observable(definition.parPriceIndex || 0);
        this.priceIndex = ko.observable(definition.priceIndex || 0);
        this.price = ko.computed(() => {
            return Prices.price(this.priceIndex() || 0);
        });
        this.lastRun = ko.observable(definition.lastRun || 0);
        this.opened = ko.observable(definition.opened || false);
        this.closed = ko.observable(definition.closed || false);
        this.operated = ko.observable(definition.operated || false);
        this.routes = ko.observableArray(definition.routes || []);
    }

    addCash(amount) {
        this.cash(this.cash() + amount);
    }

    removeCash(amount) {
        this.cash(this.cash() - amount);
    }

    start(state, playerId) {
        new StartCompany({playerId, companyId: this.id, startIndex: 7}).execute(state);
    }

    addCerts(certs) {
        this.certificates.push.apply(this.certificates, certs);
    }

    removeCerts(count) {
        return this.certificates.splice(0, count);
    }

    numCanIssue() {
        const numBankShares = CurrentGame().state().bank.numSharesOwnedOfCompany(this.id);
        const playerShares = 10 - this.shares() - numBankShares;
        return _.max([0, _.min([this.shares(), playerShares - numBankShares])]);
    }

    cashFromForcedIssues(numIssued) {
        return _.reduce(_.range(1, numIssued + 1), (sum, value) => {
            return sum + Prices.leftPrice(this.priceIndex(), value);
        }, 0);
    }

    getPrivates() {
        return _(this.privates()).map(cert => CurrentGame().state().getCompany(cert.companyId)).reject(company=>company.closed()).sortBy('name').value();
    }

    hasPrivate(id) {
        const privateCert = _.find(this.privates(), cert => cert.companyId === id);
        if(!privateCert) {
            return false;
        }

        const privateCo = CurrentGame().state().getCompany(privateCert.companyId);
        return !privateCo.closed() || privateCo.id === CompanyIDs.MAIL_CONTRACT;
    }

    addPrivate(cert) {
        this.privates.push(cert);
    }

    removePrivate(id) {
        const privates = this.privates.remove(cert => cert.companyId === id);
        return privates.length > 0 ? privates[0] : null;
    }

    addTrain(train) {
        this.trains.push(train);
    }

    addTrains(trains) {
        this.trains.push.apply(this.trains, trains);
    }

    getTrainById(trainId) {
        return _.find(this.trains(), train=>train.id === trainId);
    }

    removeTrainById(trainId) {
        const removed = this.trains.remove(train => train.id === trainId);
        return removed.length > 0 ? removed[0] : null;
    }

    removeTrainsById(trainIds) {
        return this.trains.remove(train => _.indexOf(trainIds, train.id) >= 0);
    }

    updateTrains(trains) {
        this.trains.valueWillMutate();
        _.each(trains, train => {
            const index = _.findIndex(this.trains(), oldTrain => oldTrain.id === train.id);
            if (index >= 0) {
                this.trains()[index] = train;
            }
        });
        this.trains.valueHasMutated();
    }

    numTrainsForLimit() {
        return this.getNonPhasedOutTrains().length;
    }

    hasTooManyTrains() {
        return this.numTrainsForLimit() > CurrentGame().state().trainLimit();
    }

    isAtTrainLimit() {
        return this.numTrainsForLimit() === CurrentGame().state().trainLimit();
    }

    getRunnableTrains() {
        return _.filter(this.trains(), train=> !train.purchased && !train.rusted());
    }

    getNonPhasedOutTrains() {
        return _(this.trains()).filter(train=> !train.phasedOut() && !train.rusted()).sortBy(train=>train.type).value();
    }

    getPhasedOutTrains() {
        return _.filter(this.trains(), train=> train.phasedOut() && !train.rusted());
    }

    getNonRustedTrains() {
        return _.filter(this.trains(), train=> !train.rusted());
    }

    getAvailableRouteColor() {
        const currentColors = _.map(this.getNonRustedTrains(), train => train.route.color);
        return _(_.range(1, 5)).difference(currentColors).first();
    }

    calculateRevenue() {
        return _.sumBy(this.trains(), train => train.route.revenue());
    }

    useToken() {
        this.tokens(this.tokens() - 1);
    }

    returnToken() {
        this.tokens(this.tokens() + 1);
    }

    close() {
        // remove from operating order
        const state = CurrentGame().state();
        const playerCerts = _(CurrentGame().state().players()).map(player => {
            return [player.id, player.removeAllCertsForCompany(this.id)];
        }).fromPairs().value();

        const bankCerts = state.bank.removeAllCertsForCompany(this.id);

        const tokens = _(CurrentGame().state().tilesByCellId).map(tile => {
            if (tile.hasTokenForCompany(this.id)) {
                return [tile.id, tile.removeToken(this.id)]
            }
            return null;
        }).compact().fromPairs().value();
        const reservedTokens = _(CurrentGame().state().tilesByCellId).map(tile => {
            if (tile.hasReservedTokenForCompany(this.id)) {
                return [tile.id, tile.removeReservedToken(this.id)]
            }
            return null;
        }).compact().fromPairs().value();

        const cash = this.cash();
        state.bank.addCash(cash);
        this.cash(0);

        let meatTileId = null;
        if (this.hasPrivate(CompanyIDs.MEAT_PACKING_COMPANY)) {
            const tile = _.find(CurrentGame().state().tilesByCellId, tile => {
                return tile.hasMeat();
            });
            tile.hasMeat(false);
            meatTileId = tile.id;
        }

        let steamboatTileId = null;
        if (this.hasPrivate(CompanyIDs.STEAMBOAT_COMPANY)) {
            const tile = _.find(CurrentGame().state().tilesByCellId, tile => {
                return tile.hasSteamboat();
            });
            tile.hasSteamboat(false);
            steamboatTileId = tile.id;
        }



        this.closed(true);

        return {
            id: this.id,
            playerCerts,
            bankCerts,
            tokens,
            reservedTokens,
            meatTileId,
            steamboatTileId,
            cash
        }
    }

    unclose(closeData) {
        const state = CurrentGame().state();
        _.each(closeData.playerCerts, (certs, playerId) => {
            const player = state.playersById()[playerId];
            player.addCerts(certs);
        });

        state.bank.addCerts(closeData.bankCerts);
        _.each(CurrentGame().state().tilesByCellId, tile => {
            const token = closeData.tokens[tile.id];
            if (token) {
                const splitToken = token.split('|');
                tile.addToken(splitToken[1], splitToken[0]);
            }
            const reservedToken = closeData.reservedTokens[tile.id];
            if (reservedToken) {
                const splitToken = reservedToken.split('|');
                tile.addReservedToken(splitToken[1], splitToken[0]);
            }

            if (closeData.meatTileId === tile.id) {
                tile.hasMeat(true);
            }
            if (closeData.steamboatTileId === tile.id) {
                tile.hasSteamboat(true);
            }
        });
        state.bank.removeCash(closeData.cash);
        this.cash(closeData.cash);
        this.closed(false);
    }

    phaseOut(phase) {
        const phasedOutTrains = CurrentGame().state().bank.getTrainsForPhase(phase);
        _.each(this.trains(), train => {
            if (_.indexOf(phasedOutTrains, train.type) >= 0) {
                train.phasedOut(true);
            }
        });
    }

    unphaseOut(phase) {
        const phasedOutTrains = CurrentGame().state().bank.getTrainsForPhase(phase);
        _.each(this.trains(), train => {
            if (_.indexOf(phasedOutTrains, train.type) >= 0) {
                train.phasedOut(false);
            }
        });
    }

    rust(phase) {
        const rustedTrains = CurrentGame().state().bank.getTrainsForPhase(phase);
        _.each(this.trains(), train => {
            if (_.indexOf(rustedTrains, train.type) >= 0) {
                train.rusted(true);
            }
        });
    }

    unrust(phase) {
        const rustedTrains = CurrentGame().state().bank.getTrainsForPhase(phase);
        _.each(this.trains(), train => {
            if (_.indexOf(rustedTrains, train.type) >= 0 && train.phasedOut()) {
                train.rusted(false);
            }
        });
    }


}

Company.registerClass();

export default Company;