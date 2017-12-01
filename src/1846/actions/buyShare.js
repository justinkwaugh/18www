import Action from 'common/game/action';
import Prices from '1846/config/prices';

class BuyShare extends Action {

    constructor(args) {
        super(args);

        this.playerId = args.playerId;
        this.companyId = args.companyId;
        this.treasury = args.treasury;
    }

    doExecute(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompaniesById[this.companyId];
        this.startIndex = company.priceIndex();
        this.firstPassIndex = state.firstPassIndex();

        // validate things
        // cash
        // max ownership
        // cert limit
        // source

        // TODO handle presidency change
        const cash = Prices.price(company.priceIndex());
        player.removeCash(cash);
        let cert = null;
        if (this.treasury) {
            company.cash(company.cash() + cash);
            cert = company.certificates.pop();
        }
        else {
            state.bank.cash(state.bank.cash() - cash);
            cert = state.bank.removeCert(this.companyId);
        }
        player.certificates.push(cert);
        state.firstPassIndex(null);
        // state.turnHistory.getCurrentTurn().context

    }

    doUndo(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompaniesById[this.companyId];
        const cash = Prices.price(company.priceIndex());

        state.firstPassIndex(this.firstPassIndex);
        let cert = player.certificates.pop();
        if (this.treasury) {
            company.removeCash(cash);
            company.certificates.push(cert);
        }
        else {
            state.bank.removeCash(cash);
            state.bank.certificates.push(cert);
        }
        player.addCash(cash);
    }

    summary(state) {
        const company = state.publicCompaniesById[this.companyId];
        return 'Bought 1 ' + company.nickname + ' for $' + Prices.price(
                this.startIndex) + ' from ' + (this.treasury ? 'the treasury' : 'the market');
    }

    confirmation(state) {
        const company = state.publicCompaniesById[this.companyId];
        const startIndex = company.priceIndex();
        return 'Confirm Buy 1 ' + company.nickname + ' for $' + Prices.price(
                startIndex) + ' from ' + (this.treasury ? 'the treasury' : 'the market');
    }
}

export default BuyShare