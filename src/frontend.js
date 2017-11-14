import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Dashboard from 'common/ui/dashboard';
import ko from 'knockout';
require('common/util/webpackTemplateEngine');

const dashboard = new Dashboard();
ko.applyBindings(dashboard);