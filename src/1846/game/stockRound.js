import ko from 'knockout';
import _ from 'lodash';
import CurrentGame from 'common/game/currentGame';
import BuyShare from '1846/actions/buyShare';
import SellShares from '1846/actions/sellShares';
import StartCompany from '1846/actions/startCompany';
import StockRoundPass from '1846/actions/stockRoundPass';

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
        this.selectedCompany = ko.computed(() => {
            if(!CurrentGame()) {
                return null;
            }
            return CurrentGame().state().publicCompaniesById()[this.selectedCompanyId()];
        });
        this.numberOfShares = ko.observable(definition.numberOfShares);
        this.chosenShareSource = ko.observable(definition.chosenShareSource);

        this.bankShares = ko.computed(() => {
            if(!CurrentGame()) {
                return false;
            }
            if (!CurrentGame().state().currentPlayer() || !this.selectedCompanyId()) {
                return false;
            }
            const player = CurrentGame().state().currentPlayer();
            const company = CurrentGame().state().getCompany(this.selectedCompanyId());
            const bankruptcyPrevention = !company.president() && player.numSharesOwnedOfCompany(this.selectedCompanyId()) === 0 && CurrentGame().state().bank.numSharesOwnedOfCompany(this.selectedCompanyId()) === 2
            return bankruptcyPrevention ? 0 : CurrentGame().state().bank.numSharesOwnedOfCompany(this.selectedCompanyId());
        });

        this.treasuryShares = ko.computed(() => {
            if (!this.selectedCompany()) {
                return 0;
            }
            return this.selectedCompany().shares();
        });

        this.action = ko.computed(() => {
            if(!CurrentGame()) {
                return false;
            }

            if (this.selectedAction() === Actions.BUY && this.selectedCompanyId()) {
                if (CurrentGame().state().getCompany(this.selectedCompanyId()).opened() && this.chosenShareSource()) {
                    return new BuyShare({
                                            playerId: CurrentGame().state().currentPlayerId(),
                                            companyId: this.selectedCompanyId(),
                                            treasury: this.chosenShareSource() === ShareSources.TREASURY
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
            else if (this.selectedAction() === Actions.SELL && this.selectedCompanyId() && this.numberOfShares()) {
                return new SellShares({
                                          playerId: CurrentGame().state().currentPlayerId(),
                                          companyId: this.selectedCompanyId(),
                                          count: this.numberOfShares()
                                      });
            }
            else if (this.selectedAction() === Actions.PASS) {
                return new StockRoundPass({
                                              playerIndex: CurrentGame().state().currentPlayerIndex()
                                          });
            }
        });
    }

    getParRange() {
        const cash = CurrentGame().state().currentPlayer().cash();
        return _([40, 50, 60, 70, 80, 90, 100, 112, 124, 137, 150]).filter(par => (par * 2) <= cash).value();
    }

    selectAction(actionId) {
        this.reset();
        this.selectedAction(actionId);
        if (this.selectedAction() === Actions.PASS) {
            this.commit();
        }
        else if (this.selectedAction() === Actions.SELL && _.values(
                CurrentGame().state().currentPlayer().sharesCanSell()).length === 1) {
            this.selectCompany(_.keys(CurrentGame().state().currentPlayer().sharesCanSell())[0]);
        }
    }

    selectCompany(companyId) {
        this.selectedCompanyId(companyId);
        if (this.selectedAction() === Actions.SELL && CurrentGame().state().currentPlayer().sharesCanSell()[companyId].shares === 1) {
            this.selectNumberOfShares(1);
        }
        if(this.selectedAction() === Actions.BUY && CurrentGame().state().getCompany(this.selectedCompanyId()).opened()) {
            if (this.bankShares() && !this.treasuryShares()) {
                this.selectShareSource(ShareSources.MARKET)
            }

            if (this.treasuryShares() && !this.bankShares()) {
                this.selectShareSource(ShareSources.TREASURY)
            }
        }
    }

    selectShareSource(source) {
        this.chosenShareSource(source);
        this.commit();
    }

    selectNumberOfShares(num) {
        this.numberOfShares(1);
        this.commit();
    }

    selectOpeningPriceIndex(index) {
        this.openingPriceIndex(index);
        this.commit();
    }

    reset() {
        this.chosenShareSource(null);
        this.numberOfShares(null);
        this.openingPriceIndex(null);
        this.selectedCompanyId(null);
        this.selectedAction(null);
    }

    commit() {
        this.action().execute(CurrentGame().state());
        CurrentGame().saveLocalState();
        this.reset();
    }
}

export default StockRound;