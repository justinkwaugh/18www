class PassCard {
    constructor(definition) {
        definition = definition || {};

        this.id = definition.id;
        this.name = definition.name;
        this.cost = 0;
    }
}

export default PassCard;