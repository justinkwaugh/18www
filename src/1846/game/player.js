import BasePlayer from 'common/game/basePlayer';
import Prices from '1846/config/prices';
import _ from 'lodash';
import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';

class Player extends BasePlayer {
    constructor(definition) {
        definition = definition || {};
        super(definition);

        this.sharesCanSell = ko.computed(() => {
            if(!CurrentGame()) {
                return {};
            }

            return _(CurrentGame().state().publicCompaniesById).map((company, id) => {
                return {
                    id,
                    company,
                    shares: this.getMaximumAllowedSalesOfCompany(id)
                };
            }).filter((shares) => shares > 0).value();
        });

        this.hasSharesToSell = ko.computed(() => {
            return _.keys(this.sharesCanSell()).length > 0;
        });

        this.companiesCanBuy = ko.computed(() => {
            if(!CurrentGame()) {
                return [];
            }
            return _(CurrentGame().state().publicCompaniesById).filter((company,id) => this.canBuyCompany(id)).values().value();
        });

        this.canBuyShare = ko.computed(()=> {
            return this.companiesCanBuy().length > 0;
        });
    }

    canStartCompany(companyId) {
        const company = CurrentGame().state().publicCompaniesById[companyId];
        return company.opened() === false && this.cash() >= 80;
    }

    getMaximumAllowedSalesOfCompany(companyId) {
        const ownedShares = this.numSharesOwnedOfCompany(companyId);
        let maxAllowedSales = _.min(ownedShares, 5-CurrentGame().state().bank.numSharesOwnedOfCompany(companyId));
        if(this.isPresidentOfCompany(companyId) && ownedShares === 2 && _.maxBy(CurrentGame().state().players(), (player) => player.numSharesOwnedOfCompany(companyId)) < 2) {
            maxAllowedSales = 0;
        }
        return maxAllowedSales;
    }

    canBuyCompany(companyId) {
        //@todo check sold company this turn
        const company = CurrentGame().state().publicCompaniesById[companyId];
        if (!company.opened() && !this.canStartCompany(companyId)) {
            return false;
        }
        else if (this.cash() < Prices.price(company.priceIndex())) {
            return false;
        }
        else if (company.shares() === 0 && CurrentGame().state().bank.numSharesOwnedOfCompany(companyId) === 0) {
            return false;
        }

        return true;
    }
}

export default Player;