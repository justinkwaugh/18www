import ko from 'knockout';
import _ from 'lodash';
import DraftPrivate from '1846/actions/draftPrivate';
import DraftPass from '1846/actions/draftPass';
import Sequence from '1846/game/sequence';
import CurrentGame from 'common/game/currentGame';

class PrivateDraft {
    constructor(definition) {
        definition = definition || {};

        this.privatesOffered = ko.observableArray(definition.privatesOffered);

        if (!definition.privatesOffered) {
            const state = CurrentGame().state();
            this.privatesOffered(_(state.undraftedPrivateIds()).take(state.players().length + 2).map((id) => {
                return _.startsWith(id, 'pass') ? state.passCardsById[id] : state.privateCompaniesById[id];
            }).value());
        }

        this.selectedPrivateId = ko.observable(
            definition.selectedPrivateId || (this.privatesOffered().length === 1 ? this.privatesOffered()[0].id : null));

    }

    selectPrivate(id) {
        if(this.privatesOffered().length === 1) {
            return;
        }
        this.selectedPrivateId(this.selectedPrivateId() === id ? null : id);
    }

    commit() {
        new DraftPrivate({
                             playerId: CurrentGame().state().currentPlayerId(),
                             privateId: this.selectedPrivateId(),
                             offeredIds: _.map(this.privatesOffered(), 'id')
                         }).execute(CurrentGame().state());
        Sequence.finishTurn();
    }

    pass() {
        new DraftPass({
                          playerId: CurrentGame().state().currentPlayerId(),
                          privateId: this.selectedPrivateId()
                      }).execute(CurrentGame().state());
        Sequence.finishTurn();
    }
}

export default PrivateDraft;