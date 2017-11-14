class Action {

    constructor(args) {

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

    instructions(state) {
        return [];
    }

}

export default Action;