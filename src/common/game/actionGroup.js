import Serializable from 'common/model/serializable';

class ActionGroup extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super(definition);

        this.type = definition.type;
        this.id = definition.id;
        this.actionStartIndex = definition.actionStartIndex;
        this.actionEndIndex = definition.actionEndIndex;
    }
}

ActionGroup.registerClass();

export default ActionGroup;
