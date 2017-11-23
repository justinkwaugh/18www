import ko from 'knockout';

class Cell {
    constructor(data) {
        data = data || {};

        this.id = data.id;
        this.visible = data.visible || false;
        this.upgradeable = data.upgradeable || true;
        this.top = data.top || 0;
        this.left = data.left || 0;
        this.tile = ko.observable(data.tile);
        this.neighbors = data.neighbors || [];

        this.popoverParams = {
            placement: 'right',
            content: '<div data-bind="template: { name: \'cellPopover\' }"></div>'
        };
    }

    canEdit(state) {
        return true;
    }
}

export default Cell;