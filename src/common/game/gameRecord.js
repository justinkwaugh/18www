import short from 'short-uuid';
import _ from 'lodash';
import LocalStore from 'common/util/localStore';
import Serializable from 'common/model/serializable';

class GameRecord extends Serializable {
    constructor(definition) {
        super(definition);

        this.id = definition.id || short().new();
        this.type = definition.type;
        this.name = definition.name;
        this.location = definition.location;
        this.players = definition.players;
        this.startDate = definition.startDate;
        this.endDate = definition.endDate;
        this.winner = definition.winner;
        this.round = definition.round;
        this.turn = definition.turn;
    }

    create(currentState, initialState) {
        LocalStore.store(this.id, this.serialize(), 'games');
        LocalStore.storeCompressed(this.id, initialState.serialize(), 'initialstate');
        LocalStore.storeCompressed(this.id, currentState.serialize(), 'currentstate');
    }

    loadCurrentState() {
        return Serializable.deserialize(LocalStore.loadCompressed(this.id, 'currentstate'));
    }

    loadRawCurrentState() {
        return LocalStore.load(this.id, 'currentstate');
    }

    save(state) {
        LocalStore.store(this.id, this.serialize(), 'games');
        if(state) {
            LocalStore.storeCompressed(this.id, state.serialize(), 'currentstate');
        }
    }

    static load(id) {
        return Serializable.deserialize(LocalStore.load(id, 'games'));
    }

    static list() {
        return _.map(LocalStore.list('games'), game=> {
            return GameRecord.deserialize(game);
        });
    }
}

GameRecord.registerClass();

export default GameRecord;