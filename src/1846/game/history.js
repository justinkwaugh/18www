import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';

class History {
    constructor() {
        this.selectedRound = ko.observable();
    }

    selectRound(id) {
        this.selectedRound(id);
    }

    getTurnsForRound(id) {
        const round = CurrentGame().state().roundHistory.getRound(id);
        if (!round) {
            return [];
        }
        const turnHistory = CurrentGame().state().turnHistory;
        return turnHistory.getTurnsForRange(round.actionStartIndex, round.actionEndIndex);
    }
}

export default History;