import Action from 'common/game/action';
import Prices from '1846/config/prices';

class RedeemShares extends Action {

    constructor(args) {
        super(args);

        this.companyId = args.companyId;
        this.count = args.count;
        this.price = args.price;
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        const index = company.priceIndex();
        this.price = Prices.rightPrice(index);

        const cash = this.price * this.count;
        company.removeCash(cash);
        state.bank.addCash(cash);

        const certs = state.bank.removeNonPresidentCertsForCompany(this.count, this.companyId);
        company.addCerts(certs);
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);

        const cash = this.price * this.count;
        company.addCash(cash);
        state.bank.removeCash(cash);

        const certs = company.removeCerts(this.count);
        state.bank.addCerts(certs);
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        return company.nickname + ' redeemed ' + this.count + ' shares at $' + this.price;
    }

    confirmation(state) {
        const company = state.getCompany(this.companyId);
        const index = company.priceIndex();
        const price = Prices.rightPrice(index);
        return 'Confirm redeem ' + this.count + ' shares at $' + price;
    }
}

RedeemShares.registerClass();

export default RedeemShares