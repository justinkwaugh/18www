import Action from 'common/game/action';
import Prices from '1846/config/prices';

class SellShares extends Action {

    constructor(args) {
        super(args);

        this.playerId = args.playerId;
        this.companyId = args.companyId;
        this.count = args.count;
        this.startIndex = args.startIndex;
        this.endIndex = args.endIndex;
        this.forced = args.forced;
    }

    doExecute(state) {
        const player = state.playersById()[this.playerId];
        const company = state.publicCompanies[this.companyId];
        const isPresident = company.president() === this.playerId;
        this.startIndex = company.priceIndex();

        // validate things
        // company has operated or is pres
        // owns shares
        // market space
        // presidency requirement

        // TODO handle forced and presidency change
        this.endIndex = isPresident ? Prices.leftIndex(this.startIndex) : this.startIndex;
        const cash = Prices.price(this.startIndex) * this.count;
        state.bank.cash(state.bank.cash() - cash);
        player.cash(player.cash() + cash);
        const certs = player.certificates.splice(0, Math.min(this.count, player.certificates().length-1));
        state.bank.certificates.push.apply(state.bank.certificates, certs);
    }

    doUndo(state) {

    }

    summary(state) {
        const company = state.publicCompanies[this.companyId];
        return 'Sold ' + this.count + ' ' + company.nickname + ' @ ' + Prices.price(this.startIndex);
    }

}

export default SellShares