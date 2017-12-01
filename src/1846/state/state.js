import _ from 'lodash';
import BaseState from 'common/game/baseState';
import TurnHistory from 'common/game/turnHistory';
import ActionHistory from 'common/game/actionHistory';
import PhaseIds from '1846/config/phaseIds';
import PassCard from '1846/game/passCard';
import RoundIds from '1846/config/roundIds';
import ko from 'knockout';

class State extends BaseState {
    constructor(definition) {
        definition = definition || {};
        super(definition);

        this.id = definition.id;
        this.local = definition.local;

        this.players = ko.observableArray(definition.players || []);
        this.playersById = ko.computed(()=>{
            return _.keyBy(this.players(), 'id');
        });

        this.lastPlayerId = ko.observable(definition.currentPlayerId);


        this.currentPlayerIndex = ko.observable(definition.currentPlayerIndex || 0);
        this.currentPlayerId = ko.computed(()=> {
            return this.players()[this.currentPlayerIndex()].id;
        });
        this.currentPlayer = ko.computed(()=> {
            return this.players()[this.currentPlayerIndex()];
        });
        this.currentPhaseId = ko.observable(definition.currentPhase || PhaseIds.PHASE_I);
        this.currentRoundId = ko.observable(definition.currentRoundId);
        this.currentRoundNumber = ko.observable(definition.currentRoundNumber || 0);

        // This logic is not great to have here.
        this.roundName = ko.computed(()=> {
            const currentRoundId = this.currentRoundId();
            const currentRoundNumber = this.currentRoundNumber();

            if(currentRoundId === RoundIds.PRIVATE_DRAFT) {
                return 'Privates Draft';
            }
            else if(currentRoundId === RoundIds.STOCK_ROUND) {
                return 'SR' + currentRoundNumber;
            }
            else if(currentRoundId === RoundIds.OPERATING_ROUND_1) {
                return 'OR' + currentRoundNumber + '.1';
            }
            else if (currentRoundId === RoundIds.OPERATING_ROUND_2) {
                return 'OR' + currentRoundNumber + '.2';
            }

            return '';
        });

        this.firstPassIndex = ko.observable(definition.firstPassIndex);
        this.priorityDealIndex = ko.observable(definition.priorityDealIndex);

        this.currentCompanyId = ko.observable(definition.currentCompanyId);

        this.publicCompanies = definition.publicCompanies || [];
        this.publicCompaniesById = _.keyBy(this.publicCompanies, 'id');
        this.privateCompanies = definition.privateCompanies || [];
        this.privateCompaniesById = _.keyBy(this.privateCompanies, 'id');
        this.passCards = _.map(_.range(1,this.players().length + 1), (val) => {
           return new PassCard( {
               id: 'pass' + val,
               name: 'Pass ' + val
                                });
        });
        this.passCardsById = _.keyBy(this.passCards, 'id');
        this.undraftedPrivateIds = ko.observableArray(definition.undraftedPrivateIds || _(this.privateCompanies).map('id').concat(_.map(this.passCards, 'id')).shuffle().value());

        this.priceTrack = ko.observableArray();

        this.bank = definition.bank;
        this.manifest = definition.manifest;

        this.turnHistory = definition.turnHistory || new TurnHistory(this);
        this.actionHistory = definition.actionHistory || new ActionHistory(this);
    }
}

export default State;