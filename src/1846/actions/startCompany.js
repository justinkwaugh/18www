import Action from 'common/game/action';
import Prices from '1846/config/prices';
import _ from 'lodash';

class StartCompany extends Action {

    constructor(args) {
        super(args);

        this.playerId = args.playerId;
        this.companyId = args.companyId;
        this.startIndex = args.startIndex;
    }

    doExecute(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompaniesById[this.companyId];
        const cash = Prices.price(this.startIndex)*2;

        // validate things
        // not operating
        // cash
        // cert limit

        company.priceIndex(this.startIndex);
        company.president(this.playerId);
        company.opened(true);
        player.removeCash(cash);
        company.addCash(cash);

        // First cert in company treasury always pres cert for convenience
        const cert = company.certificates.shift();
        player.certificates.push(cert);
    }

    doUndo(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompaniesById[this.companyId];
        const cash = Prices.price(this.startIndex)*2;
        company.priceIndex(0);
        company.president(null);
        company.opened(false);
        company.removeCash(cash);
        player.addCash(cash);

        const certs = player.certificates();
        const certIndex = _.findIndex(player.certificates(), { companyId : this.companyId, president: true });
        const cert = _.first(_.pullAt(certs, certIndex));
        player.certificates(certs);
        company.certificates.unshift(cert);
    }

    summary(state) {
        const company = state.publicCompaniesById[this.companyId];
        return 'Started ' + company.nickname + ' @ ' + Prices.price(this.startIndex);
    }

}

export default StartCompany