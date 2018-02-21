import ActionGroup from 'common/game/actionGroup';
import CurrentGame from 'common/game/currentGame';
import RoundIds from '1846/config/roundIds';

class Round extends ActionGroup {

    constructor(definition) {
        definition.type = 'round';
        super(definition);

        this.id = definition.id;
        this.number = definition.number;
        this.actionStartIndex = CurrentGame() ? CurrentGame().state().actionHistory.currentIndex() : 0;
    }

    getRoundName() {
        if (this.id === RoundIds.PRIVATE_DRAFT) {
            return 'Privates Draft';
        }
        else if (this.id === RoundIds.STOCK_ROUND) {
            return 'SR' + this.number;
        }
        else if (this.id === RoundIds.OPERATING_ROUND_1) {
            return 'OR' + this.number + '.1';
        }
        else if (this.id === RoundIds.OPERATING_ROUND_2) {
            return 'OR' + this.number + '.2';
        }
        return '';
    }
}

Round.registerClass();

export default Round;