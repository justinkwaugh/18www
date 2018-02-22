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
import TileManifest from '1846/config/tileManifest';
import StockBoard from '1846/game/stockBoard';
import Events from 'common/util/events';
import Sequence from '1846/game/sequence';
import OperatingRound from '1846/game/operatingRound';
import RoundIDs from '1846/config/roundIds';
import LZString from 'lz-string';

const ActivePanelIDs = {
    MAP: 'map',
    OWNERSHIP: 'ownership',
    TILE_MANIFEST: 'manifest',
    HISTORY: 'history'
};

class Game extends BaseGame {
    constructor(definition) {
        definition = definition || {};
        super(definition);

        this.record = definition.record;
        this.state = ko.observable(definition.state);
        this.grid = ko.observable(new Grid(definition.state));
        this.privateDraft = ko.observable();
        this.stockRound = ko.observable();
        this.operatingRound = ko.observable(new OperatingRound());
        this.zoom = ko.observable(.8);
        this.selectedCompany = ko.observable();

        this.activePanel = ko.observable(ActivePanelIDs.MAP);
        this.ActivePanelIDs = ActivePanelIDs;
        this.sequence = Sequence;
    }

    selectCompany(companyId) {
        if (this.selectedCompany() === companyId) {
            this.selectedCompany(null);
        }
        else {
            this.selectedCompany(companyId);
        }
    }

    zoomIn() {
        if (this.zoom() < 1.5) {
            this.zoom(this.zoom() + .05);
        }
    }

    zoomOut() {
        if (this.zoom() > .1) {
            this.zoom(this.zoom() - .05);
        }
    }

    showMap() {
        this.activePanel(ActivePanelIDs.MAP);
    }

    showOwnership() {
        this.activePanel(ActivePanelIDs.OWNERSHIP);
    }

    setActivePanel(newPanel) {
        this.activePanel(newPanel);
    }

    static createInitialState(users) {
        const publicCompanies = Companies.generatePublicCompanies();
        const privateCompanies = Companies.generatePrivateCompanies();

        const greenGroup = [CompanyIDs.CHESAPEAKE_OHIO, CompanyIDs.ERIE, CompanyIDs.PENNSYLVANIA];
        const blueGroup = [CompanyIDs.TUNNEL_BLASTING_COMPANY, CompanyIDs.STEAMBOAT_COMPANY, CompanyIDs.MEAT_PACKING_COMPANY];
        const orangeGroup = [CompanyIDs.OHIO_INDIANA, CompanyIDs.MICHIGAN_CENTRAL, CompanyIDs.LAKE_SHORE_LINE];

        const players = _(users).shuffle().map((user, index) => {
            return new Player({user, cash: 400, order: index});
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

        const manifest = new TileManifest();
        const stockBoard = new StockBoard();

        const state = new State({
                             players,
                             publicCompanies,
                             privateCompanies,
                             bank,
                             manifest,
                             stockBoard
                         });

        state.roundHistory.startRound(RoundIDs.PRIVATE_DRAFT, 1);
        state.currentPlayerIndex(state.players().length - 1);
        state.turnHistory.startTurn({state});

        return state;

    }

    updateState(newState) {
        this.state(newState);
        Sequence.restore();
        Events.emit('stateUpdated', {});
    }

    saveLocalState() {
        this.record.round = this.state().winner() ? 'Game End' : this.state().roundHistory.currentRound().getRoundName();
        this.record.turn = this.state().currentPlayer().name();
        this.record.save(this.state());
    }

    generateBugEmail() {
        const compressed = LZString.compressToEncodedURIComponent(this.state().serialize());
        const link = "mailto:justin.waugh@gmail.com?subject=Bug Report&body=" + compressed;
        window.location.href = link;
    }

}

export default Game;