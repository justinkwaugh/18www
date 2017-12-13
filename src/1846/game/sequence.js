import RoundIDs from '1846/config/roundIds';
import PrivateDraft from '1846/game/privateDraft';
import StockRound from '1846/game/stockRound';
import CurrentGame from 'common/game/currentGame';

import _ from 'lodash';
class Sequence {
    static finishTurn() {
        CurrentGame().state().turnHistory.commitTurn();
        //commit to server

        // if local
        this.nextRoundPhaseAndTurn();
    }

    static nextRoundPhaseAndTurn() {
        const game = CurrentGame();
        const state = game.state();

        const currentRound = state.roundHistory.getCurrentRound();

        if (!currentRound) {
            state.roundHistory.startRound(RoundIDs.STOCK_ROUND, 1);
            state.currentRoundId(RoundIDs.STOCK_ROUND);
            state.currentRoundNumber(1);
            state.currentPlayerIndex(0);
            game.privateDraft(null);
            game.stockRound(new StockRound());

            // state.currentRoundId(RoundIDs.PRIVATE_DRAFT);
            // state.currentPlayerIndex(state.players().length - 1);
            // game.privateDraft(new PrivateDraft());
        }
        else if (currentRound.id === RoundIDs.PRIVATE_DRAFT) {
            if(state.undraftedPrivateIds().length > 0) {
                state.currentPlayerIndex(Sequence.nextPlayerIndex(true));
                game.privateDraft(new PrivateDraft());
            }
            else {
                state.roundHistory.commitRound();
                state.roundHistory.startRound(RoundIDs.STOCK_ROUND, 1);
                state.currentRoundId(RoundIDs.STOCK_ROUND);
                state.currentRoundNumber(1);
                state.currentPlayerIndex(0);
                game.privateDraft(null);
                game.stockRound(new StockRound());
            }
        }
        else if (currentRound.id === RoundIDs.STOCK_ROUND) {
            state.currentPlayerIndex(Sequence.nextPlayerIndex());
            if(state.firstPassIndex() === state.currentPlayerIndex()) {
                state.roundHistory.commitRound();
                state.roundHistory.startRound(RoundIDs.OPERATING_ROUND_1, 1);
                state.priorityDealIndex(state.firstPassIndex());
                state.currentRoundId(RoundIDs.OPERATING_ROUND_1);
                game.stockRound(null);
            }
        }
        state.turnHistory.startTurn();
    }

    static nextPlayerIndex(reverse) {
        const state = CurrentGame().state();
        let nextPlayerIndex = state.currentPlayerIndex() + (reverse ?  -1 : 1);
        if (nextPlayerIndex < 0) {
            nextPlayerIndex = state.players().length - 1;
        }
        else if(nextPlayerIndex === state.players().length) {
            nextPlayerIndex = 0;
        }
        return nextPlayerIndex;
    }
}

export default Sequence;