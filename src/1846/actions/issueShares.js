import Action from 'common/game/action';
import Prices from '1846/config/prices';

class IssueShares extends Action {

    constructor(args) {
        super(args);

        this.companyId = args.companyId;
        this.count = args.count;
        this.price = args.price;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        const index = company.priceIndex();
        this.price = Prices.leftPrice(index);

        const cash = this.price * this.count;
        company.addCash(cash);
        state.bank.removeCash(cash);

        const certs = company.removeCerts(this.count);
        state.bank.addCerts(certs);
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);

        const cash = this.price * this.count;
        company.removeCash(cash);
        state.bank.addCash(cash);

        const certs = state.bank.removeNonPresidentCertsForCompany(this.count, this.companyId);
        company.addCerts(certs);
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        return company.nickname + ' issued ' + this.count + ' shares at $' + this.price;
    }

    confirmation(state) {
        const company = state.getCompany(this.companyId);
        const index = company.priceIndex();
        const price = Prices.leftPrice(index);
        return 'Confirm issue ' + this.count + ' shares at $' + price;
    }
}

IssueShares.registerClass();

export default IssueShares