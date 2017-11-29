import ko from 'knockout'

function cleanupPopover(element, dispose) {
    $(element).off('inserted.bs.popover');
    $(element).off('shown.bs.popover');
    $(element).off('hidden.bs.popover');

    if (currentPopover === element) {
        $(currentPopover).popover('hide');
        currentPopover = null;
    }

    if (dispose) {
        $(element).popover('dispose');
    }
}

function setupPopover(element, args, bindingContext) {

    _.defaults(args, {
        placement: 'auto',
        trigger: 'click',
        removeOnDestroy: true,
        bindContent: true,
        html: true,
        closestDiv: false
    });

    const target = args.closestDiv ? $(element).parent().closest('div') : $(element);
    const targetElement = target[0];

    const popover = target.popover(args);

    if (args.bindContent) {
        popover.on('inserted.bs.popover', function (e) {
            const pop = popover.data('bs.popover').tip;
            ko.cleanNode(pop);
            ko.applyBindingsToDescendants(bindingContext, pop);
        });
    }

    popover.on('shown.bs.popover', function (e) {
        if (currentPopover && currentPopover !== targetElement) {
            $(currentPopover).popover('hide');
        }

        if (args.onShow) {
            const pop = popover.data('bs.popover').tip;
            args.onShow(pop);
        }
        currentPopover = targetElement;
    });


    popover.on('hidden.bs.popover', function (e) {
        if (args.onHide) {
            const pop = popover.data('bs.popover').tip;
            args.onHide(pop);
        }

        if (currentPopover === targetElement) {
            currentPopover = null;
        }
    });


    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
        cleanupPopover(targetElement, true);
    });


}

let currentPopover = null;

ko.bindingHandlers.popover = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        const args = ko.utils.unwrapObservable(valueAccessor());
        setupPopover(element, args, bindingContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        const args = ko.utils.unwrapObservable(valueAccessor());
        const target = args.closestDiv ? $(element).parent().closest('div') : $(element);
        const targetElement = target[0];
        cleanupPopover(targetElement);
        setupPopover(element, args, bindingContext);
    }
};
