import ko from 'knockout';
import short from 'short-uuid';

class Player {
    constructor(definition) {
        this.id = short().new();
        this.user = ko.observable(definition.user);
        this.cash = ko.observable(definition.cash || 0);
        this.worth = ko.observable(definition.worth || 0);
        this.certificates = ko.observableArray(definition.certificates);
        this.popoverParams = {
                content: '<div data-bind="template: { name: \'playerPopover\' }"></div>'
            };
    }
}

export default Player;