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
        const company = state.getCompany(this.companyId);
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
            // Only pres share in bank, buying from bank
            if (!company.president() && player.sharesPerCompany()[this.companyId] === 1 && state.bank.numSharesOwnedOfCompany(this.companyId) === 2) {
                const nonPresidentCerts = player.removeNonPresidentCertsForCompany(1, this.companyId);
                cert = state.bank.removePresidentCertForCompany(this.companyId);
                state.bank.addCerts(nonPresidentCerts);
                this.oldPresidentId = 'bank';
                company.president(player.id);
            }
            else {
                cert = state.bank.removeNonPresidentCertsForCompany(1, this.companyId)[0];
            }
        }
        player.certificates.push(cert);

        const currentPresident = !company.president() ? state.bank : state.playersById()[company.president()];
        if ((!company.president() && player.sharesPerCompany()[this.companyId] === 2) || (company.president() && currentPresident.sharesPerCompany()[this.companyId] < player.sharesPerCompany()[this.companyId])) {
            const nonPresidentCerts = player.removeNonPresidentCertsForCompany(2, this.companyId);
            const presidentCert = currentPresident.removePresidentCertForCompany(this.companyId);

            player.addCert(presidentCert);
            currentPresident.addCerts(nonPresidentCerts);

            this.oldPresidentId = !company.president() ? 'bank' : currentPresident.id;
            company.president(player.id);
        }

        state.firstPassIndex(null);

    }

    doUndo(state) {
        const player = state.playersById()[this.playerId];
        const company = state.getCompany(this.companyId);
        const cash = Prices.price(company.priceIndex());

        state.firstPassIndex(this.firstPassIndex);

        // Was only pres share in bank, buying from bank
        if(this.oldPresidentId === 'bank' && !this.treasury && state.bank.numSharesOwnedOfCompany(this.companyId) === 1) {
            state.bank.removeCash(cash);
            player.addCash(cash);
            const presidentCert = player.removePresidentCertForCompany(this.companyId);
            const nonPresidentCerts = state.bank.removeNonPresidentCertsForCompany(1, this.companyId);
            state.bank.addCert(presidentCert);
            player.addCerts(nonPresidentCerts);
            company.president(null);
            return;
        }

        if (this.oldPresidentId ) {
            const oldPresident = this.oldPresidentId === 'bank' ? state.bank : state.playersById()[this.oldPresidentId];
            const nonPresidentCerts = oldPresident.removeNonPresidentCertsForCompany(2, this.companyId);
            const presidentCert = player.removePresidentCertForCompany(this.companyId);

            oldPresident.addCert(presidentCert);
            player.addCerts(nonPresidentCerts);

            company.president(this.oldPresidentId === 'bank' ? null : oldPresident.id);
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
        const company = state.getCompany(this.companyId);
        return 'Bought 1 ' + company.nickname + ' for $' + Prices.price(
                this.startIndex) + ' from ' + (this.treasury ? 'the treasury' : 'the market');
    }

    confirmation(state) {
        const company = state.getCompany(this.companyId);
        const startIndex = company.priceIndex();
        return 'Confirm Buy 1 ' + company.nickname + ' for $' + Prices.price(
                startIndex) + ' from ' + (this.treasury ? 'the treasury' : 'the market');
    }
}

BuyShare.registerClass();

export default BuyShare