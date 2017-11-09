import ko from 'knockout';
import Game from '1846/game/game';
import User from 'common/server/user';
import _ from 'lodash';

class Dashboard {
    constructor() {

        const users = _.map(_.range(4), (index) => {
            return new User({id: index, username: 'Player ' + (index + 1)});
        });

        this.game = ko.observable(Game.createGame(users));
    }
}

export default Dashboard;