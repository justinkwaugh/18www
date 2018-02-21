class User {
    constructor(definition) {
        definition = definition || {};
        this.id = definition.id;
        this.local = definition.local;
        this.username = definition.username;
        this.email = definition.email;
        this.passwordHash = definition.passwordHash;
        this.passwordSalt = definition.passwordSalt;
        this.verified = definition.verified || false;
    }
}

export default User;