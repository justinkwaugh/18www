import ko from 'knockout';
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

        this.game = ko.observable(Game.createGame(users));
        this.sequence = Sequence;
        Sequence.nextRoundPhaseAndTurn(this.game())
    }
}

export default Dashboard;