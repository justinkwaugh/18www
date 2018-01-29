import Action from 'common/game/action';
import CompanyTypes from 'common/model/companyTypes';
import CompanyIDs from '1846/config/companyIds';
import TrainIDs from '1846/config/trainIds';

class BuyPrivate extends Action {

    constructor(args) {
        super(args);

        this.playerId = args.playerId;
        this.privateId = args.privateId;
        this.companyId = args.companyId;
        this.price = args.price;
        this.addedToken = args.addedToken;
    }

    doExecute(state) {
        const player = state.playersById()[this.playerId];
        const company = state.getCompany(this.companyId);
        const privateCompany = state.getCompany(this.privateId);

        if (privateCompany.type === CompanyTypes.INDEPENDANT) {
            company.addCash(privateCompany.cash());
            privateCompany.closed(true);
            const train = privateCompany.trains()[0].clone();
            train.route.color = company.getAvailableRouteColor();
            train.route.clear();
            company.addTrain(train);
            const cellId = privateCompany.id === CompanyIDs.MICHIGAN_SOUTHERN ? 'C15' : 'G9';
            const tile = state.tilesByCellId[cellId];
            tile.removeToken(privateCompany.id);
            if(!tile.hasTokenForCompany(this.companyId)) {
                tile.addToken(this.companyId);
                this.addedToken = true;
            }
        }

        if (this.privateId === CompanyIDs.CHICAGO_WESTERN_INDIANA) {
            const tile = state.tilesByCellId['D6'];
            tile.reservedToken(null);
            if(!tile.hasTokenForCompany(this.companyId)) {
                tile.addToken(this.companyId, 9);
                this.addedToken = true;
            }
        }

        const cert = player.removePrivate(this.privateId);
        company.addPrivate(cert);
        company.removeCash(this.price);
        player.addCash(this.price);

    }

    doUndo(state) {
        const player = state.playersById()[this.playerId];
        const company = state.getCompany(this.companyId);
        const privateCompany = state.getCompany(this.privateId);

        if (privateCompany.type === CompanyTypes.INDEPENDANT) {
            company.removeCash(privateCompany.cash());
            privateCompany.closed(false);
            company.removeTrainById(privateCompany.trains()[0].id);
            const cellId = privateCompany.id === CompanyIDs.MICHIGAN_SOUTHERN ? 'C15' : 'G9';
            const tile = state.tilesByCellId[cellId];
            if(this.addedToken) {
                tile.removeToken(this.companyId);
            }
            tile.addToken(privateCompany.id);
        }

        if (this.privateId === CompanyIDs.CHICAGO_WESTERN_INDIANA) {
            const tile = state.tilesByCellId['D6'];
            if(this.addedToken) {
                tile.removeToken(this.companyId, 9);
            }
            tile.reservedToken(this.privateId);
        }


        const cert = company.removePrivate(this.privateId);
        player.addCert(cert);
        player.removeCash(this.price);
        company.addCash(this.price);
    }

    summary(state) {
        const company = state.getCompany(this.companyId);
        const privateCompany = state.getCompany(this.privateId);
        return company.nickname + ' purchased ' + privateCompany.name + ' for $' + this.price;
    }

    confirmation(state) {
        const privateCompany = state.getCompany(this.privateId);
        return 'Confirm purchase of ' + privateCompany.name + ' for $' + this.price;
    }
}

BuyPrivate.registerClass();

export default BuyPrivate