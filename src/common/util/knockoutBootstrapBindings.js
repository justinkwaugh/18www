import ko from 'knockout'
import _ from 'lodash'

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
    let enabledSubscription = null;

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
//TODO: store this somewhere we can get at it from the element
    if(args.enabledObservable) {
        if(!args.enabledObservable()) {
            $(targetElement).popover('disable');
        }
        enabledSubscription = args.enabledObservable.subscribe((value)=> {
            if(value) {
                $(targetElement).popover('enable');
            }
            else {
                $(targetElement).popover('disable');
            }
        });
    }

    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
        if(enabledSubscription) {
            enabledSubscription.dispose();
        }
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

ko.extenders.numeric = function(target, max) {
    //create a writable computed observable to intercept writes to our observable
    const result = ko.pureComputed({
        read: target,  //always return the original observables value
        write: function(newValue) {
            const current = target();
            let valueToWrite = (_.isNaN(newValue) || _.isNull(newValue) )? null : +newValue;
            if(valueToWrite && max && valueToWrite > max()) {
                valueToWrite = max();
            }

            //only write if it changed
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                //if the rounded value is the same, but a different value was written, force a notification for the current field
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({ notify: 'always' });

    //initialize with current value to make sure it is rounded appropriately
    result(target());

    //return the new computed observable
    return result;
};

ko.subscribable.fn.subscribeChanged = function (callback) {
    let savedValue = this.peek();
    return this.subscribe(function (latestValue) {
        const oldValue = savedValue;
        savedValue = latestValue;
        callback(latestValue, oldValue);
    });
};
