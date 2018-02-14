import Action from 'common/game/action';
import Prices from '1846/config/prices';
import Sequence from '1846/game/sequence';
import _ from 'lodash';

class DeclareBankruptcy extends Action {

    constructor(args) {
        super(args);
        this.companyId = args.companyId;
        this.playerId = args.playerId;
        this.numIssued = args.numIssued;
        this.oldCompanyPriceIndices = args.oldCompanyPriceIndices || {};
        this.oldCompanyCash = args.oldCompanyCash;
        this.oldPlayerCash = args.oldPlayerCash;
        this.oldPlayerCerts = args.oldPlayerCerts || [];
        this.oldBankCash = args.oldBankCash;
        this.closedCompanies = args.closedCompanies || {};
        this.presidentChanges = args.presidentChanges || {};
        this.oldPriorityDealIndex = args.oldPriorityDealIndex;

        // president changes
    }

    doExecute(state) {
        const company = state.getCompany(this.companyId);
        const player = state.playersById()[this.playerId];
        this.oldCompanyCash = company.cash();
        this.oldCompanyPriceIndices[this.companyId] = company.priceIndex();
        this.oldPlayerCash = player.cash();
        this.oldBankCash = state.bank.cash();

        // Force issue shares... This can't close the company because we wouldn't allow bankruptcy if it was possible
        this.numIssued = company.numCanIssue();
        const certs = company.removeCerts(this.numIssued);
        state.bank.addCerts(certs);
        company.addCash(company.cashFromForcedIssues(this.numIssued));
        company.priceIndex(Prices.leftIndex(company.priceIndex(), this.numIssued));

        // Sell off all player shares
        _.each(player.ownedCompanyIds(), companyId=> {

            const ownedCompany = state.getCompany(companyId);
            const isPresident = player.isPresidentOfCompany(companyId);
            const closing = isPresident && Prices.leftIndex(company.priceIndex()) === 0;

            if(closing) {
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
                        const nonPresidentCerts = target.removeNonPresidentCertsForCompany(2, companyId);
                        const presidentCert = player.removePresidentCertForCompany(companyId);

                        target.addCert(presidentCert);
                        player.addCerts(nonPresidentCerts);
                        company.president(target.id);
                        this.presidentChanges[companyId] = target.id;
                    }
                    else {
                        company.president(null);
                        this.presidentChanges[companyId] = null;
                    }
                    if(companyId !== this.companyId) {
                        this.oldCompanyPriceIndices[companyId] = ownedCompany.priceIndex();
                    }
                    ownedCompany.priceIndex(Prices.leftIndex(ownedCompany.priceIndex()))
                }

                const numShares = player.numSharesOwnedOfCompany();
                const cashForShares = company.price() * numShares;
                player.addCash(cashForShares);
                state.bank.removeCash(cashForShares);

                const certs = player.removeAllCertsForCompany(companyId);
                this.oldPlayerCerts.push.apply(this.oldPlayerCerts, _.map(certs, 'id'));
                state.bank.addCerts(certs);
            }
        });

        // Put money in company
        company.addCash(player.cash());
        player.cash(0);
        player.bankrupt(true);

        this.oldPriorityDealIndex = state.priorityDealIndex();

        if(state.priorityDealIndex() === state.currentPlayerIndex()) {
            state.priorityDealIndex(Sequence.nextPlayerIndex(this.oldPriorityDealIndex));
        }
    }

    doUndo(state) {
        const company = state.getCompany(this.companyId);
        const player = state.playersById()[this.playerId];

        state.priorityDealIndex(this.oldPriorityDealIndex);
        player.bankrupt(false);
        player.cash(this.oldPlayerCash);
        company.cash(this.oldCompanyCash);
        state.bank.cash(this.oldBankCash);

        const certs = state.bank.removeCertsById(this.oldPlayerCerts);
        player.addCerts(certs);

        _.each(this.presidentChanges, (otherPlayerId, companyId)=> {
            if(otherPlayerId) {
                const otherPresident = state.playersById()[otherPlayerId];
                const nonPresidentCerts = player.removeNonPresidentCertsForCompany(2, companyId);
                const presidentCert = otherPresident.removePresidentCertForCompany(companyId);

                player.addCert(presidentCert);
                otherPresident.addCerts(nonPresidentCerts);
            }
            company.president(player.id);
        });

        _.each(this.closedCompanies, (closeData, companyId)=> {
            const closedCompany = state.getCompany(companyId);
            closedCompany.unclose(closeData);
        });

        if(this.numIssued) {
            const certs = state.bank.removeNonPresidentCertsForCompany(this.numIssued, this.companyId);
            company.addCerts(certs);
        }

        _.each(this.oldCompanyPriceIndices, (index, companyId)=> {
            const otherCompany = state.getCompany(companyId);
            otherCompany.priceIndex(index);
        });
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