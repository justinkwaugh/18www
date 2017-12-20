import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';
import Game from '1846/game/game';
import User from 'common/server/user';
import Sequence from '1846/game/sequence';
import 'common/util/knockoutBootstrapBindings';
import _ from 'lodash';

class Dashboard {
    constructor() {

        const users = _.map(_.range(3), (index) => {
            return new User({id: index, username: 'Player ' + (index + 1)});
        });

        CurrentGame(Game.createGame(users));

        this.game = ko.computed(() => {
            return CurrentGame();
        });


        this.sequence = Sequence;

        if(!this.game().restoreLocalState()) {
            Sequence.nextRoundPhaseAndTurn();
        }
    }
}

export default Dashboard;