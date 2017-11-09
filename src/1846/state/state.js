import _ from 'lodash';
import BaseState from 'common/game/baseState';
import TurnHistory from 'common/game/turnHistory';
import ActionHistory from 'common/game/actionHistory';
import PhaseIds from '1846/config/phaseIds';
import RoundIds from '1846/config/roundIds';
import ko from 'knockout';

class State extends BaseState {
    constructor(definition) {
        definition = definition || {};
        super(definition);

        this.id = definition.id;
        this.local = definition.local;
        this.currentPhase = ko.observable(definition.currentPhase || PhaseIds.PHASE_I);
        this.currentRoundId = ko.observable(definition.currentRoundId || RoundIds.PRIVATE_DRAFT);
        this.currentRoundNumber = ko.observable(definition.currentRoundNumber || 0);
        this.publicCompanies = definition.publicCompanies || [];
        this.publicCompaniesById = _.keyBy(this.publicCompanies, 'id');
        this.privateCompanies = definition.privateCompanies || [];
        this.privateCompaniesById = _.keyBy(this.privateCompanies, 'id');

        this.bank = definition.bank;
        this.players = ko.observableArray(definition.players || []);
        this.lastPlayerId = ko.observable(definition.currentPlayerId );
        this.currentPlayerId = ko.observable(definition.currentPlayerId || _.last(this.players()).id);

        this.turnHistory = definition.turnHistory || new TurnHistory(this);
        this.actionHistory = definition.actionHistory || new ActionHistory(this);
    }
}

export default State;