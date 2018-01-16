import _ from 'lodash';
import TrainIDs from '1846/config/trainIds';
import TrainDefinitions from '1846/config/trainDefinitions';
import Train from 'common/model/train';


class Trains {
    static generateTrains(id, count) {
        return _.map(_.range(count-1), (id) => {
            return new Train(TrainDefinitions[id]);
        });
    }
}

export default Trains;