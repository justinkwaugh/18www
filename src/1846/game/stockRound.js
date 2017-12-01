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

const ShareSources = {
    MARKET: 'market',
    TREASURY: 'treasury'
};

class StockRound {
    constructor(definition) {
        definition = definition || {};

        this.Actions = Actions;
        this.ShareSources = ShareSources;

        this.selectedAction = ko.observable(definition.selectedAction);
        this.openingPriceIndex = ko.observable(definition.openingPriceIndex);
        this.selectedCompanyId = ko.observable(definition.selectedCompanyId);
        this.selectedCompany = ko.pureComputed(() => {
            return CurrentGame().state().publicCompaniesById[this.selectedCompanyId()];
        });
        this.numberOfShares = ko.observable(definition.numberOfShares);
        this.chosenShareSource = ko.observable(definition.chosenShareSource);

        this.bankShares = ko.pureComputed(() => {
            return CurrentGame().state().bank.numSharesOwnedOfCompany(this.selectedCompanyId());
        });

        this.treasuryShares = ko.pureComputed(() => {
            if (!this.selectedCompany()) {
                return 0;
            }
            return this.selectedCompany().shares();
        });

        this.shareSource = ko.pureComputed(() => {
            if (this.chosenShareSource()) {
                return this.chosenShareSource();
            }

            if (this.bankShares() && !this.treasuryShares()) {
                return this.ShareSources.MARKET;
            }

            if (this.treasuryShares() && !this.bankShares()) {
                return this.ShareSources.TREASURY;
            }

            return null;
        });

        this.action = ko.pureComputed(() => {
            if (this.selectedAction() === Actions.BUY && this.selectedCompanyId()) {
                if (CurrentGame().state().publicCompaniesById[this.selectedCompanyId()].opened() && this.shareSource()) {
                    return new BuyShare({
                                            playerId: CurrentGame().state().currentPlayerId(),
                                            companyId: this.selectedCompanyId(),
                                            treasury: this.shareSource() === ShareSources.TREASURY
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
        this.chosenShareSource(null);
    }

    commit() {
        this.action().execute(CurrentGame().state());
        this.reset();
    }
}

export default StockRound;