import _ from 'lodash';
import TrainIDs from '1846/config/trainIds';
import Train from 'common/model/train';

const TrainDefinitions = {
    [TrainIDs.TRAIN_2]: {
        id: TrainIDs.TRAIN_2,
        name: '2 Train',
        stops: 2,
        payingStops: 2
    },
    [TrainIDs.TRAIN_3_5]: {
        id: TrainIDs.TRAIN_3_5,
        name: '3/5 Train',
        stops: 5,
        payingStops: 3
    },
    [TrainIDs.TRAIN_4]: {
        id: TrainIDs.TRAIN_4,
        name: '4 Train',
        stops: 4,
        payingStops: 4
    },
    [TrainIDs.TRAIN_4_6]: {
        id: TrainIDs.TRAIN_4_6,
        name: '4/6 Train',
        stops: 6,
        payingStops: 4
    },
    [TrainIDs.TRAIN_5]: {
        id: TrainIDs.TRAIN_5,
        name: '5 Train',
        stops: 5,
        payingStops: 5
    },
    [TrainIDs.TRAIN_6]: {
        id: TrainIDs.TRAIN_6,
        name: '6 Train',
        stops: 6,
        payingStops: 6
    },
    [TrainIDs.TRAIN_7_8]: {
        id: TrainIDs.TRAIN_7_8,
        name: '7/8 Train',
        stops: 8,
        payingStops: 7
    }
};

class Trains {
    static generateTrains(id, count) {
        return _.map(_.range(count-1), (id) => {
            return new Train(TrainDefinitions[id]);
        });
    }
}

export default Trains;