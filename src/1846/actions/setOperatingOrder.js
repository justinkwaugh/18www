import Action from 'common/game/action';

class SetOperatingOrder extends Action {

    constructor(args) {
        super(args);
        this.operatingOrder = args.operatingOrder;
        this.oldOperatingOrder = args.oldOperatingOrder;
    }

    doExecute(state) {
        this.oldOperatingOrder = state.operatingOrder();
        state.operatingOrder(this.operatingOrder);
    }

    doUndo(state) {
        state.operatingOrder(this.oldOperatingOrder);
    }

    summary(state) {
        return 'New operating order: ' + _.join(state.operatingOrder(), ',');
    }
}

SetOperatingOrder.registerClass();

export default SetOperatingOrder