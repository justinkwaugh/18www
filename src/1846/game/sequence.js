import RoundIDs from '1846/config/roundIds';
import PrivateDraft from '1846/game/privateDraft';
import _ from 'lodash';
class Sequence {
    static finishTurn(game) {
        //commit to server
        this.nextRoundPhaseAndTurn(game);
    }

    static nextRoundPhaseAndTurn(game) {
        if (!game.state().currentRoundId()) {
            game.state().currentRoundId(RoundIDs.PRIVATE_DRAFT);
            game.state().currentPlayerIndex(game.state().players().length - 1);
            game.privateDraft(new PrivateDraft({
                                                   game,
                                                   state: game.state()
                                               }));
        }
        else if (game.state().currentRoundId() === RoundIDs.PRIVATE_DRAFT) {
            if(game.state().undraftedPrivateIds().length > 0) {
                let nextPlayerIndex = game.state().currentPlayerIndex() - 1;
                if (nextPlayerIndex < 0) {
                    nextPlayerIndex = game.state().players().length - 1;
                }
                game.state().currentPlayerIndex(nextPlayerIndex);
                game.privateDraft(new PrivateDraft({
                                                       game,
                                                       state: game.state()
                                                   }));
            }
            else {
                game.state().currentRoundId(RoundIDs.STOCK_ROUND);
                game.state().currentRoundNumber(1);
                game.state().currentPlayerIndex(0);
                game.privateDraft(null);
            }
        }
    }
}

export default Sequence;