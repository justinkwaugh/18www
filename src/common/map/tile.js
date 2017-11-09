import ko from 'knockout';

class Tile {
    constructor(data) {
        data = data || {};

        this.id = data.id;
        this.phaseId = data.phaseId;

        this.position = 0;
        this.connections = data.connections || [];

        this.revenue = 0;
        this.maxTokens = 0;
        this.tokens = [];
    }
}

export default Tile;