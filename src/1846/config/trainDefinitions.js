import TrainIDs from '1846/config/trainIds';

const TrainDefinitions = {
    [TrainIDs.TRAIN_2]: {
        id: TrainIDs.TRAIN_2,
        name: '2',
        stops: 2,
        payingStops: 2,
        cost: 80
    },
    [TrainIDs.TRAIN_3_5]: {
        id: TrainIDs.TRAIN_3_5,
        name: '3/5',
        stops: 5,
        payingStops: 3,
        cost: 160
    },
    [TrainIDs.TRAIN_4]: {
        id: TrainIDs.TRAIN_4,
        name: '4',
        stops: 4,
        payingStops: 4,
        cost: 180
    },
    [TrainIDs.TRAIN_4_6]: {
        id: TrainIDs.TRAIN_4_6,
        name: '4/6',
        stops: 6,
        payingStops: 4,
        cost: 400
    },
    [TrainIDs.TRAIN_5]: {
        id: TrainIDs.TRAIN_5,
        name: '5',
        stops: 5,
        payingStops: 5,
        cost: 450
    },
    [TrainIDs.TRAIN_6]: {
        id: TrainIDs.TRAIN_6,
        name: '6',
        stops: 6,
        payingStops: 6,
        cost: 800
    },
    [TrainIDs.TRAIN_7_8]: {
        id: TrainIDs.TRAIN_7_8,
        name: '7/8',
        stops: 8,
        payingStops: 7,
        cost: 900
    }
};

export default TrainDefinitions;