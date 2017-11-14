import ko from 'knockout'

function cleanupPopover(element) {
    $(element).off('inserted.bs.popover');
    $(element).off('shown.bs.popover');
    $(element).off('hidden.bs.popover');
    const popover = $(element).data['bs.popover'];
    if (popover) {
        popover.destroy();
    }
}

function setupPopover(element, args, bindingContext) {
    _.defaults(args, {
        placement: 'auto',
        trigger: 'click',
        removeOnDestroy: true,
        bindContent: true,
        html: true
    });

    const popover = $(element).popover(args);

    if (args.bindContent) {
        popover.on('inserted.bs.popover', function (e) {
            const pop = popover.data('bs.popover').tip;
            ko.cleanNode(pop);
            ko.applyBindingsToDescendants(bindingContext, pop);
        });
    }

    if (args.onShow) {
        popover.on('shown.bs.popover', function (e) {
            const pop = popover.data('bs.popover').tip;
            args.onShow(pop);
        });
    }

    if (args.onHide) {
        popover.on('hidden.bs.popover', function (e) {
            const pop = popover.data('bs.popover').tip;
            args.onHide(pop);
        });
    }

    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
        cleanupPopover(element);
    });
}

ko.bindingHandlers.popover = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        const args = ko.utils.unwrapObservable(valueAccessor());
        setupPopover(element, args, bindingContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        const args = ko.utils.unwrapObservable(valueAccessor());
        cleanupPopover(element);
        setupPopover(element, args, bindingContext);
    }
};
