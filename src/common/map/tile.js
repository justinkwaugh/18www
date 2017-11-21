import ko from 'knockout';

class Tile {
    constructor(data) {
        data = data || {};

        this.id = data.id;
        this.colorId = data.colorId;

        this.position = ko.observable(data.position || 0);
        this.connections = data.connections || [];
        this.upgrades = data.upgrades || [];

        this.revenue = data.revenue || 0;
        this.maxTokens = data.maxTokens || 0;
        this.tokens = ko.observableArray(data.tokens || []);

    }
}

export default Tile;