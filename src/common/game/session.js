class Session {
    constructor(definition) {
        definition = definition || {};
        this.currentUser = definition.user();
    }
}

export default Session;