import BasePlayer from 'common/game/basePlayer';

class Player extends BasePlayer {
    constructor(definition) {
        definition = definition || {};
        super(definition);
    }

    canStartCompany(state, companyId) {
        const company = state.publicCompaniesById[companyId];
        return this.cash() > 80 && company.opened() === false;
    }
}

export default Player;