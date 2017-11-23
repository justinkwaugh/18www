import ko from 'knockout';
import TileManifest from '1846/config/tileManifest';

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
        return this.getUpgradeTiles(state).length > 0;
    }

    getUpgradeTiles(state) {

        // get from manifest
        return state.manifest.getUpgradesForTile(this.tile().id) || [];
        // filter for allowed positions > 0


    }

    getAllowedTilePositions(state, tileId) {
        // Narrow by base tile

        // Check off map edges

        // check station connections

        // check connection costs (including base cost if necessary)


    }
}

export default Cell;