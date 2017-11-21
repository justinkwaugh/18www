import BasePlayer from 'common/game/basePlayer';
import Prices from '1846/config/prices';
import _ from 'lodash';

class Player extends BasePlayer {
    constructor(definition) {
        definition = definition || {};
        super(definition);
    }

    canStartCompany(state, companyId) {
        const company = state.publicCompaniesById[companyId];
        return this.cash() > 80 && company.opened() === false;
    }

    canSellCompany(state, companyId) {
        if((this.certificatesById()[companyId] || []).length === 0) {
            return false;
        }
        else if(state.bank.numSharesForCompany(companyId) >= 5) {
            return false;
        }
        else if(this.isPresidentOfCompany(companyId) &&
                this.numSharesOwnedOfCompany(companyId) === 2 &&
                _.maxBy(state.players(), (player) => player.numSharesOwnedOfCompany(companyId)) < 2) {
            return false;
        }

        return true;
    }

    canBuyCompany(state, companyId) {
        const company = state.publicCompaniesById[companyId];
        if(!company.opened() && !this.canStartCompany(state, companyId)) {
            return false;
        }
        else if (this.cash() < Prices.price(company.priceIndex())) {
            return false;
        }
        else if(company.shares() === 0 && state.bank.numSharesOwnedOfCompany(companyId) === 0) {
            return false;
        }

        return true;
    }
}

export default Player;