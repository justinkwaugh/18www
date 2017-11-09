import Dashboard from 'common/ui/dashboard';
import ko from 'knockout';
require('common/util/webpackTemplateEngine');

const dashboard = new Dashboard();
ko.applyBindings(dashboard);