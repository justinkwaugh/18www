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
            if (!CurrentGame()) {
                return {};
            }

            if (this.hasBoughtThisTurn()) {
                return {};
            }

            return _(CurrentGame().state().publicCompaniesById).map((company, id) => {
                return {
                    id,
                    company,
                    shares: this.getMaximumAllowedSalesOfCompany(id)
                };
            }).filter(data => data.shares > 0).value();
        });

        this.hasSharesToSell = ko.computed(() => {
            return _.keys(this.sharesCanSell()).length > 0;
        });

        this.companiesCanBuy = ko.computed(() => {
            if (!CurrentGame()) {
                return [];
            }

            if (this.hasBoughtThisTurn()) {
                return [];
            }

            if (this.certificates().length >= CurrentGame().state().certLimit()) {
                return [];
            }

            return _(CurrentGame().state().publicCompaniesById).filter(
                (company, id) => this.canBuyCompany(id)).values().value();
        });

        this.canBuyShare = ko.computed(() => {
            return this.companiesCanBuy().length > 0;
        });

        this.canPass = ko.computed(() => {
            return !this.hasPassedThisTurn() && !this.hasBoughtThisTurn() && !this.hasSoldThisTurn();
        });
    }

    hasBoughtThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getTurnActions(), action => {
            return action.getTypeName() === 'BuyShare' || 'StartCompany';
        });
    }

    hasSoldThisTurn(companyId) {
        if (!CurrentGame()) {
            return false;
        }
        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        if (!companyId) {
            return _.find(turn.getTurnActions(), action => {
                return action.getTypeName() === 'SellShares';
            });
        }
        else {
            return _.find(turn.getTurnActions(), action => {
                return action.getTypeName() === 'SellShares' && action.companyId === companyId;
            });
        }
    }

    hasPassedThisTurn() {
        if (!CurrentGame()) {
            return false;
        }
        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getTurnActions(), action => {
            return action.getTypeName() === 'StockRoundPass';
        });
    }

    canStartCompany(companyId) {
        const company = CurrentGame().state().publicCompaniesById[companyId];
        return company.opened() === false && this.cash() >= 80;
    }

    getMaximumAllowedSalesOfCompany(companyId) {
        const company = CurrentGame().state().publicCompaniesById[companyId];
        const ownedShares = this.numSharesOwnedOfCompany(companyId);
        let maxAllowedSales = Math.min(ownedShares, 5 - CurrentGame().state().bank.numSharesOwnedOfCompany(companyId));
        if (this.isPresidentOfCompany(companyId) && ownedShares === 2 && _(CurrentGame().state().players()).reject(
                player => player.id === this.id).map(player => player.numSharesOwnedOfCompany(companyId)).max() < 2) {
            maxAllowedSales = 0;
        }

        if (!this.isPresidentOfCompany(companyId) && !company.operated()) {
            maxAllowedSales = 0;
        }
        return maxAllowedSales;
    }

    canBuyCompany(companyId) {
        if (this.hasSoldThisTurn(companyId)) {
            return false;
        }

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