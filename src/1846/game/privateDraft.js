import ko from 'knockout';
import _ from 'lodash';
import DraftPrivate from '1846/actions/draftPrivate';
import DraftPass from '1846/actions/draftPass';
import Sequence from '1846/game/sequence';

class PrivateDraft {
    constructor(definition) {
        definition = definition || {};

        this.game = definition.game;
        this.state = definition.state;
        this.privatesOffered = ko.observableArray(definition.privatesOffered);

        if (!definition.privatesOffered) {
            this.privatesOffered(_(this.state.undraftedPrivateIds()).take(this.state.players().length + 2).map((id) => {
                return _.startsWith(id, 'pass') ? this.state.passCardsById[id] : this.state.privateCompaniesById[id];
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
                             playerId: this.state.currentPlayerId(),
                             privateId: this.selectedPrivateId(),
                             offeredIds: _.map(this.privatesOffered(), 'id')
                         }).execute(this.state);
        Sequence.finishTurn(this.game);
    }

    pass() {
        new DraftPass({
                          playerId: this.state.currentPlayerId(),
                          privateId: this.selectedPrivateId()
                      }).execute(this.state);
        Sequence.finishTurn(this.game);
    }
}

export default PrivateDraft;