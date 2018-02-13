import Action from 'common/game/action';
import Prices from '1846/config/prices';
import _ from 'lodash';

class DeclareBankruptcy extends Action {

    constructor(args) {
        super(args);
        this.companyId = args.companyId;
        this.playerId = args.playerId;
        this.numIssued = args.numIssued;
        this.oldPriceIndex = args.oldPriceIndex;
        this.oldCompanyCash = args.oldCompanyCash;
        this.oldPlayerCash = args.oldPlayerCash;
        this.oldPlayerCerts = args.oldPlayerCerts;
        this.closedCompanies = args.closedCompanies;

        // president changes
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        const player = state.playersById()[this.playerId];
        this.oldCompanyCash = company.cash();
        this.oldPriceIndex = company.priceIndex();
        this.oldPlayerCash = player.cash();

        // Force issue shares... This can't close the company because we wouldn't allow bankruptcy if it was possible
        this.numIssued = company.numCanIssue();
        const certs = company.removeCerts(this.numIssued);
        state.bank.addCerts(certs);
        company.addCash(company.cashFromForcedIssues(this.numIssued));
        company.priceIndex(Prices.leftIndex(company.priceIndex(), this.numIssued));

        // Sell off all player shares
        _.each(player.ownedCompanyIds(), companyId=> {

            const ownedCompany = state.getCompany(this.companyId);
            const isPresident = player.isPresidentOfCompany(companyId);
            const closing = isPresident && Prices.leftIndex(company.priceIndex()) === 0;

            if(closing) {
                if(!this.closedCompanies) {
                    this.closedCompanies = {};
                }
                this.closedCompanies[companyId] = ownedCompany.close();
            }
            else {
                if (isPresident) {
                    const target = _(state.players()).filter(
                        otherPlayer => player.id !== otherPlayer.id && otherPlayer.sharesPerCompany()[companyId] >= 2).sortBy(
                        otherPlayer => {
                            return otherPlayer.order() > player.order() ? otherPlayer.order() : otherPlayer.order() + 10;
                        }).first();

                    if (target) {
                        const nonPresidentCerts = target.removeNonPresidentCertsForCompany(2, this.companyId);
                        const presidentCert = player.removePresidentCertForCompany(this.companyId);

                        target.addCert(presidentCert);
                        player.addCerts(nonPresidentCerts);
                        company.president(target.id);
                    }
                    else {
                        company.president(null);
                    }
                }

                const cashForShares = company.price() * player.numSharesOwnedOfCompany(companyId);
                player.addCash(cashForShares);
                state.bank.removeCash(cashForShares);

                const certs = player.removeAllCertsForCompany(companyId);
                state.bank.addCerts(certs);
            }
        });

        // Put money in company
        company.addCash(player.cash());
        player.cash(0);
        player.bankrupt(true);

        throw new Exception('hi')
    }

    doUndo(state) {

    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        const player = state.playersById()[this.playerId];
        return player.name() + ' declared bankruptcy';
    }

    confirmation(state) {
        return 'Confirm bankruptcy';
    }
}

DeclareBankruptcy.registerClass();

export default DeclareBankruptcy