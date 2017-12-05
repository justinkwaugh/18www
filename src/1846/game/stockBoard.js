
import Prices from '1846/config/prices';
import StockBoardEntry from '1846/game/stockBoardEntry';
import Serializable from 'common/model/serializable';
import ko from 'knockout';

import _ from 'lodash';

class StockBoard extends Serializable{
    constructor(definition) {
        definition = definition || { stockBoard: {}};
        super();

        this.stockBoard = ko.observable({});
        _.each(_.range(0,Prices.getPriceList().length), index => {
            this.stockBoard()[index] = definition.stockBoard[index] || new StockBoardEntry({
                value: Prices.price(index)});
        });
    }


    addCompany(newCompany) {
        this.stockBoard()[newCompany.priceIndex()].companies.push(newCompany.id);
    }

    removeCompany(companyToRemove) {
        this.stockBoard()[companyToRemove.priceIndex()].companies.remove((item)=> item === companyToRemove.id);
    }
}

StockBoard.registerClass();

export default StockBoard;