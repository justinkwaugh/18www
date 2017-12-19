import RoundIDs from '1846/config/roundIds';
import PrivateDraft from '1846/game/privateDraft';
import StockRound from '1846/game/stockRound';
import OperatingRound from '1846/game/operatingRound';
import CurrentGame from 'common/game/currentGame';

import _ from 'lodash';
class Sequence {

    static undoLastAction() {
        CurrentGame().state().turnHistory.currentTurn().undoLast();
        CurrentGame().saveLocalState();
    }

    static finishTurn() {
        CurrentGame().state().turnHistory.commitTurn();
        //commit to server

        // if local
        this.nextRoundPhaseAndTurn();
        CurrentGame().saveLocalState();
    }

    static nextRoundPhaseAndTurn() {
        const game = CurrentGame();
        const state = game.state();

        const currentRound = state.roundHistory.getCurrentRound();

        if (!currentRound) {
            state.roundHistory.startRound(RoundIDs.PRIVATE_DRAFT, 1);
            state.currentRoundId(RoundIDs.PRIVATE_DRAFT);
            state.currentPlayerIndex(state.players().length - 1);
            game.privateDraft(new PrivateDraft());
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
                state.operatingOrder = state.stockBoard.getOperatingOrder(true);
                state.currentCompanyId(state.operatingOrder[0]);
                const presidentPlayerId = state.publicCompaniesById[state.currentCompanyId()].president();
                state.currentPlayerIndex(_.findIndex(state.players(), player=>player.id === presidentPlayerId));
            }
        }
        else if (currentRound.id === RoundIDs.OPERATING_ROUND_1) {
            const companyIndex = _.indexOf(state.operatingOrder, state.currentCompanyId());
            if(companyIndex < state.operatingOrder.length-1) {
                state.currentCompanyId(companyIndex+1);
                const presidentPlayerId = state.publicCompaniesById[state.currentCompanyId()].president();
                state.currentPlayerIndex(_.findIndex(state.players(), player=>player.id === presidentPlayerId));
            }
            else {
                const currentRoundNumber = state.roundHistory.currentRound().number;
                state.roundHistory.commitRound();
                state.roundHistory.startRound(RoundIDs.OPERATING_ROUND_2, currentRoundNumber);
                state.currentCompanyId(state.operatingOrder[0]);
                const presidentPlayerId = state.publicCompaniesById[state.currentCompanyId()].president();
                state.currentPlayerIndex(_.findIndex(state.players(), player=>player.id === presidentPlayerId));
            }
        }
        else if (currentRound.id === RoundIDs.OPERATING_ROUND_2) {
            const companyIndex = _.indexOf(state.operatingOrder, state.currentCompanyId());
            if(companyIndex < state.operatingOrder.length-1) {
                state.currentCompanyId(companyIndex+1);
                const presidentPlayerId = state.publicCompaniesById[state.currentCompanyId()].president();
                state.currentPlayerIndex(_.findIndex(state.players(), player=>player.id === presidentPlayerId));
            }
            else {
                const currentRoundNumber = state.roundHistory.currentRound().number;
                state.roundHistory.commitRound();
                state.roundHistory.startRound(RoundIDs.STOCK_ROUND, currentRoundNumber+1);
                state.currentPlayerIndex(state.priorityDealIndex());
                game.stockRound(new StockRound());
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

    static restore() {
        const game = CurrentGame();
        const state = game.state();
        const currentRound = state.roundHistory.getCurrentRound();
        if (currentRound.id === RoundIDs.PRIVATE_DRAFT) {
            game.privateDraft(new PrivateDraft());
        }
        else if(currentRound.id === RoundIDs.STOCK_ROUND) {
            game.stockRound(new StockRound());
        }
    }
}

export default Sequence;