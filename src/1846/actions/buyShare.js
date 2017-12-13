import Action from 'common/game/action';
import Prices from '1846/config/prices';

class BuyShare extends Action {

    constructor(args) {
        super(args);

        this.playerId = args.playerId;
        this.companyId = args.companyId;
        this.treasury = args.treasury;
        this.startIndex = args.startIndex;
        this.firstPassIndex = args.firstPassIndex;
        this.oldPresidentId = args.oldPresidentId;
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

        const currentPresident = state.playersById()[company.president()];
        if (currentPresident.sharesPerCompany()[this.companyId] < player.sharesPerCompany()[this.companyId]) {
            const nonPresidentCerts = player.removeNonPresidentCertsForCompany(2, this.companyId);
            const presidentCert = currentPresident.removePresidentCertForCompany(this.companyId);

            player.addCert(presidentCert);
            currentPresident.addCerts(nonPresidentCerts);

            this.oldPresidentId = currentPresident.id;
            company.president(player.id);
        }

        state.firstPassIndex(null);

    }

    doUndo(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompaniesById[this.companyId];
        const cash = Prices.price(company.priceIndex());

        state.firstPassIndex(this.firstPassIndex);

        if(this.oldPresidentId) {
            const oldPresident = state.playersById()[this.oldPresidentId];
            const nonPresidentCerts = oldPresident.removeNonPresidentCertsForCompany(2, this.companyId);
            const presidentCert = player.removePresidentCertForCompany(this.companyId);

            oldPresident.addCert(presidentCert);
            player.addCerts(nonPresidentCerts);

            company.president(oldPresident.id);
        }

        const cert = player.removeNonPresidentCertsForCompany(1, this.companyId)[0];
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