import Prices from '1846/config/prices';
import StockBoardEntry from '1846/game/stockBoardEntry';
import Serializable from 'common/model/serializable';
import ko from 'knockout';

import _ from 'lodash';

class StockBoard extends Serializable {
    constructor(definition) {
        definition = definition || {stockBoard: {}};
        super();

        this.stockBoard = ko.observable({});
        // Will have to manage setting this back up on deserialization
        this.subscriptions = {};

        _.each(_.range(0, Prices.getPriceList().length), index => {
            this.stockBoard()[index] = definition.stockBoard[index] || new StockBoardEntry({
                                                                                               value: Prices.price(
                                                                                                   index)
                                                                                           });
        });
    }

    toJSON() {
        const plainObject = super.toJSON();
        delete plainObject.subscriptions;
        plainObject.stockBoard = this.stockBoard();
        return plainObject;
    }

    addCompany(company) {
        this.addToEntry(company);
        this.subscriptions[company.id] = company.priceIndex.subscribe(() => {
            this.removeFromEntry(company.id);
            this.addToEntry(company);
        });
    }

    removeCompany(companyId) {
        this.removeFromEntry(companyId);
        this.subscriptions[companyId].dispose();
    }

    removeFromEntry(companyId) {
        _(this.stockBoard()).values().each(entry => {
            entry.companies.remove((item) => item === companyId);
        });
    }

    addToEntry(company) {
        this.stockBoard()[company.priceIndex()].companies.push(company.id);
    }

}

StockBoard.registerClass();

export default StockBoard;