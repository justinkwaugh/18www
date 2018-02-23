import ActionGroup from 'common/game/actionGroup';
import CurrentGame from 'common/game/currentGame';
import RoundTypes from '1846/config/roundTypes';
import short from 'short-uuid';
import _ from 'lodash';

class Round extends ActionGroup {

    constructor(definition) {
        definition.type = 'round';
        super(definition);

        this.id = definition.id || short().new();
        this.roundType = definition.roundType;
        this.number = definition.number;
        this.actionStartIndex = _.isNumber(definition.actionStartIndex) ? definition.actionStartIndex : CurrentGame() ? CurrentGame().state().actionHistory.currentIndex() : 0
    }

    getRoundName() {
        if (this.roundType === RoundTypes.PRIVATE_DRAFT) {
            return 'Privates Draft';
        }
        else if (this.roundType === RoundTypes.STOCK_ROUND) {
            return 'SR' + this.number;
        }
        else if (this.roundType === RoundTypes.OPERATING_ROUND_1) {
            return 'OR' + this.number + '.1';
        }
        else if (this.roundType === RoundTypes.OPERATING_ROUND_2) {
            return 'OR' + this.number + '.2';
        }
        return '';
    }
}

Round.registerClass();

export default Round;