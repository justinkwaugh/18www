import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';
import GameRecord from 'common/game/gameRecord';
import NewGameForm from 'common/ui/newGameForm';
import Game from '1846/game/game';
import Sequence from '1846/game/sequence';
import 'common/util/knockoutBootstrapBindings';
import _ from 'lodash';
import 'knockout-delegated-events';
import Events from 'common/util/events';

const ActivePanelIDs = {
    ACTIVE_GAMES: 'active_games',
    COMPLETED_GAMES: 'completed_games',
    NEW_GAME: 'new_game'
};

class Dashboard {
    constructor() {
        this.game = ko.computed(() => {
            return CurrentGame();
        });

        this.availableGames = ko.observableArray();
        this.completedGames = ko.observableArray();
        this.newGameForm = new NewGameForm();

        this.activePanel = ko.observable(ActivePanelIDs.ACTIVE_GAMES);
        this.ActivePanelIDs = ActivePanelIDs;

        Events.on('newGameCreated', (record)=> {
            this.loadAvailableGames();
            this.launchGame(record);
        });

        this.loadAvailableGames();
    }

    setActivePanel(newPanel) {
        this.activePanel(newPanel);
    }

    loadAvailableGames() {
        this.availableGames(_.orderBy(GameRecord.list(), ['startDate', 'name']));
    }

    launchGame(record) {
        const state = record.loadCurrentState();
        const game = new Game({ record: record, state: state });
        CurrentGame(game);
        game.sequence.restore();
    }

    onMouseUp() {
        Events.emit('global:mouseup');
    }

    onMouseOut() {
        Events.emit('global:mouseout');
    }


}

export default Dashboard;