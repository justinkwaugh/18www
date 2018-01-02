import BasePlayer from 'common/game/basePlayer';
import Prices from '1846/config/prices';
import _ from 'lodash';
import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';
import CompanyTypes from 'common/model/companyTypes';

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
            }).filter(data => data.shares > 0).keyBy('id').value();
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

        this.canBuy = ko.computed(() => {
            return !this.isOverCertLimit() && !this.hasPassedThisTurn() && this.companiesCanBuy().length > 0;
        });

        this.canPass = ko.computed(() => {
            return !this.isOverCertLimit() && !this.hasPassedThisTurn() && !this.hasBoughtThisTurn() && !this.hasSoldThisTurn();
        });

        this.canSell = ko.computed(() => {
            return !this.hasPassedThisTurn() && !this.hasBoughtThisTurn() && this.hasSharesToSell();
        });
    }

    isOverCertLimit() {
        if (!CurrentGame()) {
            return false;
        }

        return this.certificates().length > CurrentGame().state().certLimit();
    }

    hasBoughtThisTurn() {
        if (!CurrentGame()) {
            return false;
        }

        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'BuyShare' || action.getTypeName() === 'StartCompany';
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
            return _.find(turn.getActions(), action => {
                return action.getTypeName() === 'SellShares';
            });
        }
        else {
            return _.find(turn.getActions(), action => {
                return action.getTypeName() === 'SellShares' && action.companyId === companyId;
            });
        }
    }

    hasSoldThisRound(companyId) {
        if (!CurrentGame()) {
            return false;
        }
        const round = CurrentGame().state().roundHistory.currentRound();
        if (!round) {
            return false;
        }
        return _.find(round.getActions(), action => {
                return action.getTypeName() === 'SellShares' && action.companyId === companyId;
            });
    }

    hasPassedThisTurn() {
        if (!CurrentGame()) {
            return false;
        }
        const turn = CurrentGame().state().turnHistory.currentTurn();
        if (!turn) {
            return false;
        }

        return _.find(turn.getActions(), action => {
            return action.getTypeName() === 'StockRoundPass';
        });
    }

    canStartCompany(companyId) {
        const company = CurrentGame().state().publicCompaniesById[companyId];
        return company.opened() === false && this.cash() >= 80;
    }

    getMaximumAllowedSalesOfCompany(companyId) {
        if (this.hasSoldThisTurn(companyId))  {
            return 0;
        }
        const company = CurrentGame().state().publicCompaniesById[companyId];
        const ownedShares = this.numSharesOwnedOfCompany(companyId);
        let maxAllowedSales = Math.min(ownedShares, 5 - CurrentGame().state().bank.numSharesOwnedOfCompany(companyId));
        if(maxAllowedSales > 0) {
            if (this.isPresidentOfCompany(companyId) && _(CurrentGame().state().players()).reject(
                    player => player.id === this.id).map(
                    player => player.numSharesOwnedOfCompany(companyId)).max() < 2) {
                maxAllowedSales = Math.max(ownedShares - 2, 0);
            }

            if (!this.isPresidentOfCompany(companyId) && !company.operated()) {
                maxAllowedSales = 0;
            }
        }
        return maxAllowedSales;
    }

    canBuyCompany(companyId) {
        if (this.hasSoldThisTurn(companyId) || this.hasSoldThisRound(companyId)) {
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

    getPrivates() {
        return _(this.certificatesById()).keys().map(companyId => CurrentGame().state().getCompany(companyId)).filter({type : CompanyTypes.PRIVATE}).sortBy('name').value();
    }
}

Player.registerClass();

export default Player;