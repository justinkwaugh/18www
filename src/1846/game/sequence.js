import RoundIDs from '1846/config/roundIds';
import PrivateDraft from '1846/game/privateDraft';
import StockRound from '1846/game/stockRound';
import CompanyIDs from '1846/config/companyIds';
import OperatingRound from '1846/game/operatingRound';
import SetPriorityDeal from '1846/actions/setPriorityDeal';
import SetOperatingOrder from '1846/actions/setOperatingOrder';
import AdjustStockPrices from '1846/actions/adjustStockPrices';
import PrivateIncome from '1846/actions/privateIncome';
import CurrentGame from 'common/game/currentGame';
import Events from 'common/util/events';

import _ from 'lodash';
class Sequence {

    static undoLastAction() {
        CurrentGame().state().turnHistory.currentTurn().undoLast();
        CurrentGame().saveLocalState();
        Events.emit('undo');
    }

    static finishTurn() {
        CurrentGame().state().turnHistory.commitTurn();
        Events.emit('turnEnd');
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
            state.currentPlayerIndex(state.players().length - 1);
            game.privateDraft(new PrivateDraft());
        }
        else if (currentRound.id === RoundIDs.PRIVATE_DRAFT) {
            if (state.undraftedPrivateIds().length > 0) {
                state.currentPlayerIndex(Sequence.nextPlayerIndex(null,true));
                game.privateDraft(new PrivateDraft());
            }
            else {
                Sequence.onPrivateDraftEnd(game);
            }
        }
        else if (currentRound.id === RoundIDs.STOCK_ROUND) {
            const nextPlayer = Sequence.nextPlayerIndex();
            if (state.firstPassIndex() === nextPlayer) {
                Sequence.onStockRoundEnd(game);
            }
            else {
                state.currentPlayerIndex(nextPlayer);
            }
        }
        else if (currentRound.id === RoundIDs.OPERATING_ROUND_1 || currentRound.id === RoundIDs.OPERATING_ROUND_2) {
            const nextCompanyIndex = Sequence.getNextCompanyIndex(state);
            if (nextCompanyIndex < state.operatingOrder().length) {
                Sequence.setNextCompanyAndPlayer(state, nextCompanyIndex);
            }
            else {
                Sequence.onOperatingRoundEnd(game, currentRound.id);
            }
        }
        state.turnHistory.startTurn();
    }

    static onPrivateDraftEnd(game) {
        const state = game.state();
        state.roundHistory.commitRound();
        state.currentPlayerIndex(0);
        game.privateDraft(null);
        game.stockRound(new StockRound());
        state.roundHistory.startRound(RoundIDs.STOCK_ROUND, 1);
        game.showOwnership();
    }

    static onStockRoundEnd(game) {
        const state = game.state();
        new SetPriorityDeal({playerIndex: state.firstPassIndex()}).execute(state);
        new AdjustStockPrices({}).execute(state);
        const currentRoundNumber = state.roundNumber();
        state.roundHistory.commitRound();

        game.stockRound(null);
        state.roundHistory.startRound(RoundIDs.OPERATING_ROUND_1);
        new PrivateIncome({}).execute(state);
        new SetOperatingOrder({operatingOrder: state.stockBoard.getOperatingOrder(currentRoundNumber === 1)}).execute(
            state);
        Sequence.setNextCompanyAndPlayer(state, 0);
        game.showMap();
    }

    static onOperatingRoundEnd(game, currentRoundId) {
        const state = game.state();
        _.each(state.publicCompanies, company => {
            _.each(company.trains(), train => {
                train.purchased = false;
            });
        });

        if (currentRoundId === RoundIDs.OPERATING_ROUND_1) {
            state.roundHistory.commitRound();

            state.roundHistory.startRound(RoundIDs.OPERATING_ROUND_2);
            new PrivateIncome({}).execute(state);
            new SetOperatingOrder({operatingOrder: state.stockBoard.getOperatingOrder()}).execute(state);
            Sequence.setNextCompanyAndPlayer(state, 0);

        }
        else {
            const currentRoundNumber = state.roundNumber();
            state.roundHistory.commitRound();
            state.currentCompanyId(null);
            state.currentPlayerIndex(state.priorityDealIndex());
            state.roundHistory.startRound(RoundIDs.STOCK_ROUND, currentRoundNumber + 1);
            state.firstPassIndex(null);
            game.stockRound(new StockRound());
            game.showOwnership();
        }
    }

    static getNextCompanyIndex(state) {
        return _.indexOf(state.operatingOrder(), state.currentCompanyId()) + 1;
    }

    static setNextCompanyAndPlayer(state, companyIndex) {
        state.currentCompanyId(state.operatingOrder()[companyIndex]);
        let presidentPlayerId = state.getCompany(state.currentCompanyId()).president();
        if(!presidentPlayerId) {
            presidentPlayerId = _(state.players()).reject(player=>player.bankrupt()).sample().id;
        }
        const nextPresidentIndex = _.findIndex(state.players(), player => player.id === presidentPlayerId);
        state.currentPlayerIndex(nextPresidentIndex);
    }

    static nextPlayerIndex(fromIndex, reverse) {
        const state = CurrentGame().state();
        if(!_.isNumber(fromIndex)) {
            fromIndex = state.currentPlayerIndex();
        }

        let nextPlayerIndex = 0;
        do {
            nextPlayerIndex = fromIndex + (reverse ? -1 : 1);
            if (nextPlayerIndex < 0) {
                nextPlayerIndex = state.players().length - 1;
            }
            else if (nextPlayerIndex === state.players().length) {
                nextPlayerIndex = 0;
            }
            fromIndex = nextPlayerIndex;
        } while(state.players()[nextPlayerIndex].bankrupt());

        return nextPlayerIndex;
    }

    static restore() {
        const game = CurrentGame();
        const state = game.state();
        const currentRound = state.roundHistory.getCurrentRound();
        if (currentRound.id === RoundIDs.PRIVATE_DRAFT) {
            game.privateDraft(new PrivateDraft());
        }
        else if (currentRound.id === RoundIDs.STOCK_ROUND) {
            game.stockRound(new StockRound());
            game.showOwnership();
        }
    }
}

export default Sequence;