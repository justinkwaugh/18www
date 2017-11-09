import ko from 'knockout';

class Cell {
    constructor(data) {
        data = data || {};

        this.id = data.id;
        this.visible = data.visible || false;
        this.top = data.top || 0;
        this.left = data.left || 0;
        this.tile = ko.observable(data.tile);

        this.imageUrl = ko.computed(() => {
            const tile = this.tile();
            if(tile) {
                return 'url(\'images/tiles/' + tile.id + '.png\')';
            }
        });
    }
}

export default Cell;