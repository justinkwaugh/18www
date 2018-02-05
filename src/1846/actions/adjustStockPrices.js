import Action from 'common/game/action';
import CompanyTypes from 'common/model/companyTypes';
import Prices from '1846/config/prices';
import _ from 'lodash';

class AdjustStockPrices extends Action {

    constructor(args) {
        super(args);
        this.oldStockboardCompanies= args.oldStockboardCompanies;
    }

    doExecute(state) {
        this.oldStockboardCompanies = state.stockBoard.getPopulatedStockboardCompanies;
        const operatingOrder = state.stockBoard.getOperatingOrder();
        // Handle company closing
        _.each(operatingOrder, companyId=> {
            const company = state.getCompany(companyId);
            if(!company.type === CompanyTypes.PUBLIC) {
                return;
            }

            if(!company.opened()) {
                return;
            }

            if(state.bank.numSharesOwnedOfCompany(company.id) > 0) {
                company.priceIndex(Prices.leftIndex(company.priceIndex()));
            }
            else if( company.shares() === 0) {
                company.priceIndex(Prices.rightIndex(company.priceIndex()));
            }
        });
    }

    doUndo(state) {
        _.each(state.publicCompanies, company=> {
            if(!company.opened()) {
                return;
            }

            if(state.bank.numSharesOwnedOfCompany(company.id) > 0) {
                company.priceIndex(Prices.rightIndex(company.priceIndex()));
            }
            else if( company.shares() === 0) {
                company.priceIndex(Prices.leftIndex(company.priceIndex()));
            }
        });
        state.stockboard.restoreStockboardCompanies(this.oldStockboardCompanies);
    }

    summary(state) {
        return 'adjusted prices'
    }
}

AdjustStockPrices.registerClass();

export default AdjustStockPrices