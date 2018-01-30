import Action from 'common/game/action';
import Prices from '1846/config/prices';
import CompanyIDs from '1846/config/companyIds'
import ValidationError from 'common/game/validationError';

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
        const price = Prices.price(this.startIndex);
        const cash = price * 2;
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
        company.addCash(cash + (this.companyId === CompanyIDs.ILLINOIS_CENTRAL ? price : 0));


        const tile = state.tilesByCellId[company.homeCellId];
        company.useToken();
        tile.addToken(company.id);
        tile.removeReservedToken(company.id);

        // First cert in company treasury always pres cert for convenience
        const cert = company.certificates.shift();
        player.addCert(cert);
        state.firstPassIndex(null);

    }

    doUndo(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompaniesById[this.companyId];
        const price = Prices.price(this.startIndex);
        const cash = price*2;

        const tile = state.tilesByCellId[company.homeCellId];
        tile.removeToken(company.id);
        tile.addReservedToken(company.id);
        company.returnToken();

        company.removeCash(cash + (this.companyId === CompanyIDs.ILLINOIS_CENTRAL ? price : 0));
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