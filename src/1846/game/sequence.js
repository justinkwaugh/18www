import RoundTypes from '1846/config/roundTypes';
import PrivateDraft from '1846/game/privateDraft';
import StockRound from '1846/game/stockRound';
import SetPriorityDeal from '1846/actions/setPriorityDeal';
import SetOperatingOrder from '1846/actions/setOperatingOrder';
import AdjustStockPrices from '1846/actions/adjustStockPrices';
import PrivateIncome from '1846/actions/privateIncome';
import CurrentGame from 'common/game/currentGame';
import Events from 'common/util/events';
import CompanyIDs from '1846/config/companyIds';
import UpdateSequence from '1846/actions/updateSequence';

import _ from 'lodash';
class Sequence {

    static undoLastAction() {
        CurrentGame().state().turnHistory.currentTurn().undoLast();
        CurrentGame().saveLocalState();
        Events.emit('undo');
    }

    static undoToRoundStart(roundId) {
        this.undoToIndex(CurrentGame().state().roundHistory.getRound(roundId).actionStartIndex);
    }

    static undoToTurnStart(turnId) {
        this.undoToIndex(CurrentGame().state().turnHistory.getTurn(turnId).actionStartIndex);
    }

    static undoToIndex(index) {

    }

    static interruptTurn(interruptionType) {
        Events.emit('turnEnd');
        const game = CurrentGame();
        const state = game.state();
        state.interruptionType(interruptionType);
        state.interruptedCompanyId(state.currentCompanyId());

        //commit to server

        // if local
        state.actionHistory.commit();
        this.nextOutOfTurn();
        CurrentGame().saveLocalState();
    }

    static finishTurn() {
        const state = CurrentGame().state();
        if (state.interruptionType()) {
            state.turnHistory.currentTurn().commitActionGroup();

            //commit to server
            state.actionHistory.commit();
            this.nextOutOfTurn();
        }
        else {
            state.turnHistory.commitTurn();
            Events.emit('turnEnd');

            //commit to server

            // if local
            state.actionHistory.commit();
            if(Sequence.isGameOverDueToBankruptcy()) {
                this.endGame()
            }
            else {
                this.nextRoundPhaseAndTurn();
            }
        }
        CurrentGame().saveLocalState();
    }

    static nextOutOfTurn() {
        const game = CurrentGame();
        const state = game.state();

        // Train limit checks
        const companyWithTooManyTrains = _.find(state.publicCompanies, company => {
            return company.hasTooManyTrains();
        });

        if (companyWithTooManyTrains) {
            state.turnHistory.currentTurn().startActionGroup(state.interruptionType());
            state.currentCompanyId(companyWithTooManyTrains.id);
        }
        else {
            state.currentCompanyId(state.interruptedCompanyId());
            state.interruptionType(null);
            state.interruptedCompanyId(null);
        }

        const presidentPlayerId = state.currentCompany().president();
        const nextPresidentIndex = _.findIndex(state.players(), player => player.id === presidentPlayerId);
        state.currentPlayerIndex(nextPresidentIndex);
    }

    static endGame() {
        const state = CurrentGame().state();
        state.roundHistory.commitRound();
        new UpdateSequence({winner:_.maxBy(state.players(), player=>player.getNetWorth()).id}).execute(state);
    }

    static nextRoundPhaseAndTurn() {
        const game = CurrentGame();
        const state = game.state();

        const currentRound = state.roundHistory.getCurrentRound();

        if (!currentRound) {
            state.roundHistory.startRound(RoundTypes.PRIVATE_DRAFT, 1);
            new UpdateSequence({playerIndex: state.players().length - 1}).execute(state);
            game.privateDraft(new PrivateDraft());
        }
        else if (currentRound.roundType === RoundTypes.PRIVATE_DRAFT) {
            if (state.undraftedPrivateIds().length > 0) {
                new UpdateSequence({playerIndex: Sequence.nextPlayerIndex(null, true)}).execute(state);
                game.privateDraft(new PrivateDraft());
            }
            else {
                Sequence.onPrivateDraftEnd(game);
            }
        }
        else if (currentRound.roundType === RoundTypes.STOCK_ROUND) {
            const nextPlayer = Sequence.nextPlayerIndex();
            if (state.firstPassIndex() === nextPlayer) {
                Sequence.onStockRoundEnd(game);
            }
            else {
                new UpdateSequence({playerIndex: nextPlayer}).execute(state);
            }
        }
        else if (currentRound.roundType === RoundTypes.OPERATING_ROUND_1 || currentRound.roundType === RoundTypes.OPERATING_ROUND_2) {
            const nextCompanyIndex = Sequence.getNextCompanyIndex(state);
            if (nextCompanyIndex < state.operatingOrder().length) {
                Sequence.setNextCompanyAndPlayer(state, nextCompanyIndex);
            }
            else {
                Sequence.onOperatingRoundEnd(game, currentRound.roundType);
            }
        }
        state.turnHistory.startTurn({state});
    }

    static onPrivateDraftEnd(game) {
        const state = game.state();
        state.roundHistory.commitRound();
        new UpdateSequence({playerIndex: 0}).execute(state);
        game.privateDraft(null);
        game.stockRound(new StockRound());
        state.roundHistory.startRound(RoundTypes.STOCK_ROUND, 1);
        game.showOwnership();
    }

    static onStockRoundEnd(game) {
        const state = game.state();
        new SetPriorityDeal({playerIndex: state.firstPassIndex()}).execute(state);
        new AdjustStockPrices({}).execute(state);
        const currentRoundNumber = state.roundNumber();
        state.roundHistory.commitRound();

        game.stockRound(null);
        state.roundHistory.startRound(RoundTypes.OPERATING_ROUND_1);
        new SetOperatingOrder({operatingOrder: state.stockBoard.getOperatingOrder(currentRoundNumber === 1)}).execute(
            state);
        new PrivateIncome({}).execute(state);
        if(!Sequence.doSteamboat(state)) {
            Sequence.setNextCompanyAndPlayer(state, 0);
        }
        game.showMap();
    }

    static onOperatingRoundEnd(game, currentRoundType) {
        const state = game.state();
        _.each(state.publicCompanies, company => {
            _.each(company.trains(), train => {
                train.purchased = false;
            });
        });

        if (currentRoundType === RoundTypes.OPERATING_ROUND_1) {
            state.roundHistory.commitRound();
            state.roundHistory.startRound(RoundTypes.OPERATING_ROUND_2);
            new SetOperatingOrder({operatingOrder: state.stockBoard.getOperatingOrder()}).execute(state);
            new PrivateIncome({}).execute(state);
            if(!Sequence.doSteamboat(state)) {
                Sequence.setNextCompanyAndPlayer(state, 0);
            }
        }
        else {
            if(Sequence.isGameOverDueToBankBreaking()) {
                this.endGame();
            }
            else {
                const currentRoundNumber = state.roundNumber();
                state.roundHistory.commitRound();
                state.roundHistory.startRound(RoundTypes.STOCK_ROUND, currentRoundNumber + 1);
                new UpdateSequence({playerIndex: state.priorityDealIndex(), companyId: null, firstPassIndex:null}).execute(state);
                game.stockRound(new StockRound());
                game.showOwnership();
            }
        }
    }

    static getNextCompanyIndex(state) {
        // In case of bankruptcy causing change of presidency but still no train...
        const company = state.currentCompany();
        if (company && company.president() && company.getNonPhasedOutTrains().length === 0) {
            return _.indexOf(state.operatingOrder(), state.currentCompanyId());
        }

        return company ? _.indexOf(state.operatingOrder(), state.currentCompanyId()) + 1 : 0;
    }

    static doSteamboat(state) {
        const steamboatOwner = Sequence.getSteamboatOwner();
        if(steamboatOwner) {
            const steamboatOwnerIndex = _.findIndex(state.players(), player => player.id === steamboatOwner.id);
            new UpdateSequence({playerIndex: steamboatOwnerIndex, companyId: null}).execute(state);
            return true;
        }
        return false;
    }

    static setNextCompanyAndPlayer(state, companyIndex) {
        const companyId = state.operatingOrder()[companyIndex];
        const nextCompany = state.getCompany(companyId);

        let presidentPlayerId = nextCompany.president();
        if (!presidentPlayerId) {
            presidentPlayerId = _(state.players()).reject(player => player.bankrupt()).sample().id;
        }
        const nextPresidentIndex = _.findIndex(state.players(), player => player.id === presidentPlayerId);

        new UpdateSequence({playerIndex: nextPresidentIndex, companyId}).execute(state);
        CurrentGame().selectedCompany(state.currentCompanyId());
    }

    static nextPlayerIndex(fromIndex, reverse) {
        const state = CurrentGame().state();
        if (!_.isNumber(fromIndex)) {
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
        }
        while (state.players()[nextPlayerIndex].bankrupt());

        return nextPlayerIndex;
    }

    static restore() {

        const game = CurrentGame();
        const state = game.state();
        const currentRound = state.roundHistory.getCurrentRound();
        if(!currentRound) {
            return;
        }
        if (currentRound.roundType === RoundTypes.PRIVATE_DRAFT) {
            game.privateDraft(new PrivateDraft());
        }
        else if (currentRound.roundType === RoundTypes.STOCK_ROUND) {
            game.stockRound(new StockRound());
            game.showOwnership();
        }
        else {
            CurrentGame().selectedCompany(state.currentCompanyId());
        }
    }

    static getSteamboatOwner() {
        return _.find(CurrentGame().state().players(), player => {
            return player.hasPrivate(CompanyIDs.STEAMBOAT_COMPANY);
        });
    }

    static isGameOverDueToBankBreaking() {
        return CurrentGame().state().bank.cash() <= 0;
    }

    static isGameOverDueToBankruptcy() {
        return _.filter(CurrentGame().state().players(), player=>!player.bankrupt()).length === 1;
    }
}

export default Sequence;