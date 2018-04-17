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
import LZString from 'lz-string';
import Serializable from 'common/model/serializable';
import BrowserDetect from 'common/util/browserDetect';

const ActivePanelIDs = {
    ACTIVE_GAMES: 'active_games',
    COMPLETED_GAMES: 'completed_games',
    NEW_GAME: 'new_game'
};

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
        results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

class Dashboard {
    constructor() {
        this.isIE = BrowserDetect.isIE();
        this.game = ko.computed(() => {
            return CurrentGame();
        });

        this.availableGames = ko.observableArray();
        this.completedGames = ko.observableArray();
        this.newGameForm = new NewGameForm();

        this.activePanel = ko.observable(ActivePanelIDs.ACTIVE_GAMES);
        this.ActivePanelIDs = ActivePanelIDs;

        Events.on('newGameCreated', (record) => {
            this.loadAvailableGames();
            this.goToGame(record);
        });

        if (!this.checkNavigation()) {
            this.loadAvailableGames();
        }


        // _.delay(() => {
        //     this.fileInput = document.getElementById('fileInput');
        //     this.fileInput.addEventListener('change', (e) => {
        //         this.loadState();
        //     });
        // }, 2000);

        Events.emit('app-ready');
    }

    resetGame() {
        if (CurrentGame()) {
            Events.emit('game-reset');
            Events.removeAllListeners('trackLaid');
            Events.removeAllListeners('gridRestored');
            Events.removeAllListeners('undo');
            Events.removeAllListeners('turnEnd');
            Events.removeAllListeners('stateUpdated');
            Events.removeAllListeners('drawRoutes');
            Events.removeAllListeners('clearRoutes');
            Events.removeAllListeners('global:mouseup');
            Events.removeAllListeners('global:mouseout');
            Events.removeAllListeners('tileUpdated');
            CurrentGame(null);
        }
    }

    checkNavigation() {
        const gameId = getParameterByName('game');
        if (gameId) {
            const record = GameRecord.load(gameId);
            if (record) {
                this.launchGame(record);
                return true;
            }
        }
        return false;
    }

    setActivePanel(newPanel) {
        this.activePanel(newPanel);
    }

    loadAvailableGames() {
        this.availableGames(_.orderBy(GameRecord.list(), ['startDate', 'name']));
    }

    goToDashboard() {
        window.location.href = window.location.protocol + '//' + window.location.host + window.location.pathname
    }

    goToGame(record) {
        window.location.href = '?game=' + record.id;
    }

    launchGame(record) {
        const state = record.loadCurrentState();
        debugger
        const game = new Game({record: record, state: state});
        CurrentGame(game);
        game.sequence.restore();
        Events.emit('stateUpdated');
    }

    onMouseUp() {
        Events.emit('global:mouseup');
    }

    onMouseOut(param, param2) {
    }

    downloadState() {
        if (!CurrentGame()) {
            return;
        }
        const record = CurrentGame().record;
        const state = record.loadCurrentState();
        const download = {
            record: record.serialize(),
            state: state.serialize()
        };
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + LZString.compressToEncodedURIComponent(
                                 JSON.stringify(download)));
        element.setAttribute('download', '1846-' + record.name + '-state');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    sendBugEmail() {
        const link = "mailto:justin.waugh@gmail.com?subject=1846 Bug Report";
        const element = document.createElement('a');
        element.setAttribute('href', link);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    loadState() {
        const file = this.fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const decompressed = JSON.parse(LZString.decompressFromEncodedURIComponent(reader.result));
            const record = GameRecord.deserialize(decompressed.record);
            const state = Serializable.deserialize(decompressed.state);
            // record.save(state);
            const newState = Game.generateOriginalGameState(state);
            const gameRecord = new GameRecord({
                                                  type: '1846',
                                                  name: 'Game - Copy',
                                                  location: 'local',
                                                  startDate: new Date().toISOString().substring(0, 10),
                                                  players: newState.players().length,
                                                  round: newState.roundHistory.currentRound().getRoundName(),
                                                  turn: newState.currentPlayer().name()
                                              });
            gameRecord.create(newState, newState);
            Events.emit('newGameCreated', gameRecord);
        };

        reader.readAsText(file);


    }
}

export default Dashboard;