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
        const company = state.publicCompanies[this.companyId];
        this.startIndex = company.priceIndex();

        // validate things
        // cash
        // max ownership
        // cert limit
        // source

        // TODO handle presidency change
        const cash = Prices.price(company.priceIndex());
        player.cash(player.cash()-cash);
        let cert = null;
        if(this.treasury) {
            company.cash(company.cash() + cash);
            cert = company.certificates.pop();
        }
        else {
            state.bank.cash(state.bank.cash() - cash);
            cert = state.bank.removeCert(this.companyId);
        }
        player.certificates.push(cert);

    }

    doUndo(state) {

    }

    summary(state) {
        const company = state.publicCompaniesById[this.companyId];
        return 'Bought 1 ' + company.nickname + ' @ ' + Prices.price(this.startIndex);
    }

    confirmation(state) {
        const company = state.publicCompaniesById[this.companyId];
        return 'Confirm Buy 1 ' + company.nickname + ' @ ' + Prices.price(this.startIndex);
    }
}

export default BuyShare