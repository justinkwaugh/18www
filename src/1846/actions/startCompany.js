import Action from 'common/game/action';
import Prices from '1846/config/prices';
import ValidationError from 'common/game/validationError';
import _ from 'lodash';

class StartCompany extends Action {

    constructor(args) {
        super(args);

        this.playerId = args.playerId;
        this.companyId = args.companyId;
        this.startIndex = args.startIndex;
        this.firstPassIndex = args.firstPassIndex;
    }

    doExecute(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompaniesById[this.companyId];
        const cash = Prices.price(this.startIndex)*2;
        this.firstPassIndex = state.firstPassIndex();

        // validate things
        if(company.opened()) {
            throw new ValidationError('Cannot open a company that was already opened');
        }

        if(player.cash() < cash) {
            throw new ValidationError(player.name() + ' does not have enough cash to open ' + company.name + ' at ' + (cash/2));
        }

        // cert limit

        company.priceIndex(this.startIndex);
        company.president(this.playerId);
        company.opened(true);
        state.stockBoard.addCompany(company);
        player.removeCash(cash);
        company.addCash(cash);

        state.tilesByCellId[company.homeCellId].addToken(company.id);

        // First cert in company treasury always pres cert for convenience
        const cert = company.certificates.shift();
        player.addCert(cert);
        state.firstPassIndex(null);

    }

    doUndo(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompaniesById[this.companyId];
        const cash = Prices.price(this.startIndex)*2;


        state.tilesByCellId[company.homeCellId].removeToken(company.id);

        company.removeCash(cash);
        player.addCash(cash);

        state.stockBoard.removeCompany(company.id);
        company.priceIndex(0);
        company.president(null);
        company.opened(false);

        const cert = player.removePresidentCertForCompany(this.companyId);
        company.certificates.unshift(cert);
    }

    summary(state) {
        const company = state.publicCompaniesById[this.companyId];
        return 'Opened ' + company.nickname + ' @ ' + Prices.price(this.startIndex);
    }

    confirmation(state) {
        const company = state.publicCompaniesById[this.companyId];
        return 'Confirm Open ' + company.nickname + ' @ ' + Prices.price(this.startIndex);
    }
}

StartCompany.registerClass();

export default StartCompany