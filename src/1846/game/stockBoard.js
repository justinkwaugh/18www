import Prices from '1846/config/prices';
import CompanyIDs from '1846/config/companyIds';
import StockBoardEntry from '1846/game/stockBoardEntry';
import Serializable from 'common/model/serializable';
import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';
import Events from 'common/util/events';
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

        Events.on('stateUpdated', ()=>{
            _.each(this.stockBoard(), entry=> {
                _.each(entry.companies(), (companyId) => {
                    const company = CurrentGame().state().publicCompaniesById[companyId];
                    this.subscribeToCompany(company);
                });
            });
        });
    }

    toJSON() {
        const plainObject = super.toJSON();
        delete plainObject.subscriptions;
        plainObject.stockBoard = _.pickBy(plainObject.stockBoard, (entry, index)=> entry.companies().length > 0);
        return plainObject;
    }

    restoreEntries(stockBoard) {

    }

    addCompany(company) {
        this.addToEntry(company);
        this.subscribeToCompany(company);
    }

    removeCompany(companyId) {
        this.removeFromEntry(companyId);
        this.subscriptions[companyId].dispose();
    }

    subscribeToCompany(company) {
        this.subscriptions[company.id] = company.priceIndex.subscribe(() => {
            this.removeFromEntry(company.id);
            this.addToEntry(company);
        });
    }

    removeFromEntry(companyId) {
        _(this.stockBoard()).values().each(entry => {
            entry.companies.remove((item) => item === companyId);
        });
    }

    addToEntry(company) {
        this.stockBoard()[company.priceIndex()].companies.push(company.id);
    }

    getCompaniesForPriceIndex(priceIndex) {
        return _.clone(this.stockBoard()[priceIndex].companies());
    }

    setCompaniesForPriceIndex(priceIndex,companies) {
        this.stockBoard()[priceIndex].companies(_.clone(companies));
    }

    getPopulatedStockboardCompanies() {
        return _(this.stockBoard()).pickBy(entry=> entry.companies().length > 0).mapValues(entry=>_.clone(entry.companies())).value();
    }

    restoreStockboardCompanies(stockboardData) {
        _.each(stockboardData, (companies, index)=> {
            this.stockBoard()[index] = _.clone(companies);
        });
    }

    getOperatingOrder(reverse) {
        let entries = _.values(this.stockBoard());
        if(!reverse) {
            entries = _.reverse(entries);
        }

        const minors = _([CompanyIDs.MICHIGAN_SOUTHERN, CompanyIDs.BIG_4]).reject(companyId=>CurrentGame().state().getCompany(companyId).closed()).value();
        const majors = _(entries).map(entry => entry.companies()).flatten().compact().value();
        return _.concat(minors, majors);
    }

}

StockBoard.registerClass();

export default StockBoard;