import Serializable from 'common/model/serializable';

class Action extends Serializable{

    constructor(definition) {
        super();

    }

    static execute(state, args) {
        const action = new this(args);
        action.execute(state);
    }

    execute(state) {
        this.doExecute(state);
        state.actionHistory.addAction(this);
    }

    doUndo() {

    }


    doExecute() {

    }

    summary(state) {
        return 'Unknown action';
    }

    instructions(state) {
        return [this.summary(state)];
    }

}

export default Action;