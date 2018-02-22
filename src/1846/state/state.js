import _ from 'lodash';
import BaseState from 'common/game/baseState';
import RoundHistory from 'common/game/roundHistory';
import TurnHistory from 'common/game/turnHistory';
import ActionHistory from 'common/game/actionHistory';
import PhaseIds from '1846/config/phaseIds';
import PassCard from '1846/game/passCard';
import RoundIds from '1846/config/roundIds';
import Serializable from 'common/model/serializable';
import ko from 'knockout';

class State extends BaseState {
    constructor(definition) {
        definition = definition || {};
        super(definition);

        this.id = definition.id;
        this.version = definition.version || 0;
        this.local = definition.local;

        this.winner = ko.observable(definition.winner);
        this.players = ko.observableArray(definition.players || []);
        this.playersById = ko.computed(() => {
            return _.keyBy(this.players(), 'id');
        });
        this.playersByOrder = ko.computed(() => {
            return _.sortBy(this.players(), player => player.order());
        });

        this.lastPlayerId = ko.observable(definition.currentPlayerId);

        this.interruptedCompanyId = ko.observable(definition.interruptedCompanyId);
        this.interruptionType = ko.observable(definition.interruptionType);

        this.currentPlayerIndex = ko.observable(definition.currentPlayerIndex || 0);
        this.currentPlayerId = ko.computed(() => {
            return this.players()[this.currentPlayerIndex()].id;
        });
        this.currentPlayer = ko.computed(() => {
            return this.players()[this.currentPlayerIndex()];
        });
        this.currentPhaseId = ko.observable(definition.currentPhaseId || PhaseIds.PHASE_I);
        this.currentCompanyId = ko.observable(definition.currentCompanyId);

        this.firstPassIndex = ko.observable(definition.firstPassIndex);
        this.priorityDealIndex = ko.observable(definition.priorityDealIndex);
        this.certLimit = ko.computed(() => {
            return this.calculateCertLimit();
        });
        this.trainLimit = ko.observable(definition.trainLimit || 4);

        this.publicCompanies = definition.publicCompanies || [];
        this.publicCompaniesById = ko.computed(()=>{ return _.keyBy(this.publicCompanies, 'id'); });
        this.privateCompanies = definition.privateCompanies || [];
        this.privateCompaniesById = ko.computed(()=>{ return _.keyBy(this.privateCompanies, 'id'); });
        this.allCompaniesById = ko.computed(()=>{ return _(this.publicCompanies).concat(this.privateCompanies).keyBy('id').value(); });
        this.openCompanies = ko.computed(()=> {
            return _.reject(this.publicCompanies, company=>company.closed());
        });

        this.currentCompany = ko.computed(() => {
            return this.currentCompanyId() ? this.getCompany(this.currentCompanyId()) : null;
        });

        this.passCards = _.map(_.range(1, this.players().length + 1), (val) => {
            return new PassCard({
                                    id: 'pass' + val,
                                    name: 'Pass ' + val
                                });
        });
        this.passCardsById = _.keyBy(this.passCards, 'id');
        this.undraftedPrivateIds = ko.observableArray(
            definition.undraftedPrivateIds || _(this.privateCompanies).map('id').concat(
                _.map(this.passCards, 'id')).shuffle().value());

        this.stockBoard = definition.stockBoard;
        this.bank = definition.bank;
        this.manifest = definition.manifest;

        this.roundHistory = definition.roundHistory || new RoundHistory();
        this.turnHistory = definition.turnHistory || new TurnHistory();
        this.actionHistory = definition.actionHistory || new ActionHistory();

        this.roundName = ko.computed(() => {
            const currentRound = this.roundHistory.getCurrentRound();
            if (!currentRound) {
                return '';
            }

            return currentRound.getRoundName();
        });

        this.roundId = ko.computed(() => {
            const currentRound = this.roundHistory.getCurrentRound();
            if (!currentRound) {
                return '';
            }

            return currentRound.id;
        });

        this.roundNumber = ko.computed(() => {
            const currentRound = this.roundHistory.getCurrentRound();
            if (!currentRound) {
                return '';
            }

            return currentRound.number;
        });

        this.tilesByCellId = definition.tilesByCellId || {};
        this.operatingOrder = ko.observable(definition.operatingOrder || []);
    }

    calculateCertLimit() {
        const numOpenCompanies = _.filter(this.publicCompanies, publicCompany=>!publicCompany.closed()).length;
        const numPlayers = this.players().length;
        if(numPlayers === 3) {
            return numOpenCompanies > 4 ? 14 : 11;
        }
        else if(numPlayers === 4) {
            return numOpenCompanies > 5 ? 12 : numOpenCompanies > 4 ? 10 : 8;
        }
        else {
            return numOpenCompanies > 6 ? 11 : numOpenCompanies > 5 ? 10 : numOpenCompanies > 4 ? 8 : 6;
        }
    }

    isOperatingRound() {
        return !this.winner() && this.roundId() === RoundIds.OPERATING_ROUND_1 || this.roundId() === RoundIds.OPERATING_ROUND_2;
    }

    isStockRound() {
        return !this.winner() && this.roundId() === RoundIds.STOCK_ROUND;
    }

    isOperatingRound1() {
        return !this.winner() && this.roundId() === RoundIds.OPERATING_ROUND_1;
    }

    isOperatingRound2() {
        return !this.winner() && this.roundId() === RoundIds.OPERATING_ROUND_2;
    }

    getPriorPhase() {
        if (this.currentPhaseId() === PhaseIds.PHASE_IV) {
            return PhaseIds.PHASE_III;
        }
        else if (this.currentPhaseId() === PhaseIds.PHASE_III) {
            return PhaseIds.PHASE_II;
        }

        return PhaseIds.PHASE_I;
    }


    getNextPhase() {
        if (this.currentPhaseId() === PhaseIds.PHASE_I) {
            return PhaseIds.PHASE_II;
        }
        else if (this.currentPhaseId() === PhaseIds.PHASE_II) {
            return PhaseIds.PHASE_III;
        }

        return PhaseIds.PHASE_IV;
    }

    getCompany(companyId) {
        return this.allCompaniesById()[companyId];
    }

    getOperatingCompanies() {
        return _.map(this.operatingOrder(), companyId => this.getCompany(companyId));
    }

    trySerialize() {
        console.log(this.serialize());
    }

    tryDeserialize() {
        debugger;
        const state = Serializable.deserialize(this.serialize());
    }
}

State.registerClass();

export default State;