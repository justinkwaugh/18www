import BaseGame from 'common/game/baseGame';
import Grid from '1846/map/grid';
import Companies from '1846/config/companies';
import CompanyIDs from '1846/config/companyIds';
import State from '1846/state/state';
import Player from '1846/game/player';
import PhaseIDs from '1846/config/phaseIds';
import Bank from 'common/game/bank';
import ko from 'knockout';
import _ from 'lodash';
import PriceEntry from '1846/game/priceEntry';


const Prices = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 112, 124, 137, 150, 165, 180, 195, 212, 230, 250, 270, 295, 320, 345, 375, 405, 475, 510, 550];

const ActivePanelIDs = {
    MAP: 'map',
    OWNERSHIP: 'ownership',
    HISTORY: 'history'
};

class Game extends BaseGame {
    constructor(definition) {
        definition = definition || {};
        super(definition);

        this.state = ko.observable(definition.state);
        this.grid = ko.observable(new Grid());
        this.privateDraft = ko.observable();

        this.activePanel = ko.observable(ActivePanelIDs.MAP);
        this.ActivePanelIDs = ActivePanelIDs;

        const priceEntries = _.map(Prices, (price) => {
            return new PriceEntry({ value: price });
        });

        this.priceTrack = ko.observableArray(priceEntries);

    }
    setActivePanel(newPanel) {
        this.activePanel(newPanel);
    }

    static createGame(users) {

        const publicCompanies = Companies.generatePublicCompanies();
        const privateCompanies = Companies.generatePrivateCompanies();

        const greenGroup = [CompanyIDs.CHESAPEAKE_OHIO, CompanyIDs.ERIE, CompanyIDs.PENNSYLVANIA];
        const blueGroup = [CompanyIDs.TUNNEL_BLASTING_COMPANY, CompanyIDs.STEAMBOAT_COMPANY, CompanyIDs.MEAT_PACKING_COMPANY];
        const orangeGroup = [CompanyIDs.OHIO_INDIANA, CompanyIDs.MICHIGAN_CENTRAL, CompanyIDs.LAKE_SHORE_LINE];

        const players = _(users).shuffle().map((user) => {
            return new Player({user, cash: 400});
        }).value();

        if (players.length === 3 || players.length === 4) {
            const numToRemove = players.length === 3 ? 2 : 1;
            const greenRemovals = _(greenGroup).shuffle().take(numToRemove).value();
            const blueRemovals = _(blueGroup).shuffle().take(numToRemove).value();
            const orangeRemovals = _(orangeGroup).shuffle().take(numToRemove).value();

            _.remove(publicCompanies, (company) => _.indexOf(greenRemovals, company.id) >= 0);
            _.remove(privateCompanies, (company) => _.indexOf(blueRemovals, company.id) >= 0);
            _.remove(privateCompanies, (company) => _.indexOf(orangeRemovals, company.id) >= 0);
        }

        let cash = 0;
        const trainsByPhase = {};
        if (players.length === 3) {
            cash = 5300;
            trainsByPhase[PhaseIDs.PHASE_I] = 5;
            trainsByPhase[PhaseIDs.PHASE_II] = 4;
            trainsByPhase[PhaseIDs.PHASE_III] = 3;
            trainsByPhase[PhaseIDs.PHASE_IV] = -1;
        }
        else if (players.length === 4) {
            cash = 5900;
            trainsByPhase[PhaseIDs.PHASE_I] = 6;
            trainsByPhase[PhaseIDs.PHASE_II] = 5;
            trainsByPhase[PhaseIDs.PHASE_III] = 4;
            trainsByPhase[PhaseIDs.PHASE_IV] = -1;
        }
        else if (players.length === 5) {
            cash = 7000;
            trainsByPhase[PhaseIDs.PHASE_I] = 7;
            trainsByPhase[PhaseIDs.PHASE_II] = 6;
            trainsByPhase[PhaseIDs.PHASE_III] = 5;
            trainsByPhase[PhaseIDs.PHASE_IV] = -1;
        }

        const bank = new Bank({cash, trainsByPhase});

        _.each(publicCompanies, (company) => {
            bank.certificates.push(_.last(company.certificates()));
        });

        const state = new State({
                                    players,
                                    publicCompanies,
                                    privateCompanies,
                                    bank
                                });


        return new Game({
                            state
                        });
    }


}

export default Game;