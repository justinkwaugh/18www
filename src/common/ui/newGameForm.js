import ko from 'knockout';
import _ from 'lodash';
import User from 'common/server/user';
import Game from '1846/game/game';
import GameRecord from 'common/game/gameRecord';
import Events from 'common/util/events';
import short from 'short-uuid';

class NewGameForm {
    constructor() {

        this.type = ko.observable('1846');
        this.name = ko.observable();
        this.numPlayers = ko.observable(3);
        this.player1 = ko.observable();
        this.player2 = ko.observable();
        this.player3 = ko.observable();
        this.player4 = ko.observable();
        this.player5 = ko.observable();
        this.players = [this.player1, this.player2, this.player3, this.player4, this.player5];
    }

    setNumPlayers(num) {
        if (num < 5) {
            this.player5(null);
        }

        if (num < 4) {
            this.player4(null);
        }
        this.numPlayers(num);
    }

    createLocalGame() {
        const users = _(this.players).take(this.numPlayers()).map( (playerName, index)=> {
            return new User({id: short().new(), username: playerName() || 'Player ' + (index+1) });
        }).value();
        const state = Game.createInitialState(users);
        const gameRecord = new GameRecord({
                                              type: this.type(),
                                              name: this.name() || 'New Game',
                                              location: 'local',
                                              startDate: new Date().toISOString(),
                                              players: users.length,
                                              round: state.roundHistory.currentRound().getRoundName(),
                                              turn: state.currentPlayer().name()
                                          });
        gameRecord.create(state, state);
        Events.emit('newGameCreated', gameRecord);
    }

}

export default NewGameForm;