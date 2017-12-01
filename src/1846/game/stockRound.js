import ko from 'knockout';
import CurrentGame from 'common/game/currentGame';
import BuyShare from '1846/actions/buyShare';
import StartCompany from '1846/actions/startCompany';
import StockRoundPass from '1846/actions/stockRoundPass';
import Sequence from '1846/game/sequence';

const Actions = {
    SELL: 'sell',
    BUY: 'buy',
    PASS: 'pass'
};

const ShareSource = {
    MARKET: 'market',
    TREASURY: 'treasury'
};

class StockRound {
    constructor(definition) {
        definition = definition || {};

        this.Actions = Actions;

        this.selectedAction = ko.observable(definition.selectedAction);
        this.openingPriceIndex = ko.observable(definition.openingPriceIndex);
        this.selectedCompanyId = ko.observable(definition.selectedCompanyId);
        this.numberOfShares = ko.observable(definition.numberOfShares);
        this.shareSource = ko.observable(definition.shareSource);
        this.action = ko.computed(() => {
            if (this.selectedAction() === Actions.BUY && this.selectedCompanyId()) {
                if (CurrentGame().state().publicCompaniesById[this.selectedCompanyId()].opened()) {
                    return new BuyShare({
                                            playerId: CurrentGame().state().currentPlayerId(),
                                            companyId: this.selectedCompanyId(),
                                            treasury: false
                                        });
                }
                else if (this.openingPriceIndex()) {
                    return new StartCompany({
                                                playerId: CurrentGame().state().currentPlayerId(),
                                                companyId: this.selectedCompanyId(),
                                                startIndex: this.openingPriceIndex()
                                            });
                }
            }
            else if (this.selectedAction() === Actions.PASS) {
                return new StockRoundPass({
                                              playerIndex: CurrentGame().state().currentPlayerIndex()
                                          });
            }
        });
    }

    selectAction(actionId) {
        this.reset();
        this.selectedAction(actionId);
    }

    reset() {
        this.selectedAction(null);
        this.openingPriceIndex(null);
        this.selectedCompanyId(null);
        this.numberOfShares(null);
        this.shareSource(null);
    }

    commit() {
        this.action().execute(CurrentGame().state());
        this.reset();
        Sequence.finishTurn();
    }
}

export default StockRound;