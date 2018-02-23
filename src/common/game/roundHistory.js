import _ from 'lodash';
import ko from 'knockout';
import Round from 'common/game/round';
import Serializable from 'common/model/serializable';

class RoundHistory extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super(definition);
        this.rounds = ko.observableArray(definition.rounds || []);
        this.currentRound = ko.observable(definition.currentRound);
    }

    startRound(type, number) {
        number = number || _.last(this.rounds()).number;
        this.currentRound(new Round({
            roundType: type,
            number: number
        }));
    }

    commitRound() {
        this.currentRound().commit();
        this.rounds.push(this.currentRound());
        this.currentRound(null);
    }

    getCurrentRound() {
        return this.currentRound();
    }

    lastRound() {
        return _.last(this.rounds());
    }

    getRound(id) {
        return this.currentRound() && this.currentRound().id === id ? this.currentRound() : _.find(this.rounds(), {id});
    }

    getAllRounds() {
        const all = _.clone(this.rounds());
        if(this.currentRound()) {
            all.push(this.currentRound())
        }
        return all;
    }
}

RoundHistory.registerClass();

export default RoundHistory;