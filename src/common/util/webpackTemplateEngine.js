import ko from 'knockout';

const templateContext = require.context("html-loader!views", true);

//define a template source that simply treats the template name as its content
const sources = {},
     engine = new ko.nativeTemplateEngine();

//create a template source that loads its template using the require.js text plugin
ko.templateSources.webpackTemplate = function (key,data) {
    this.key = key;
    this.templateData = data;
    this.requested = false;
    this.retrieved = false;
};

ko.templateSources.webpackTemplate.prototype.text = function (value) {
    //always return the current template
    if (arguments.length === 0) {
        return this.templateData
    }
};


//our engine needs to understand when to create a "requireTemplate" template source
engine.makeTemplateSource = function (template, doc) {
    let el;

    //if a name is specified
    if (typeof template === "string") {
        //if there is an element with this id and it is a script tag, then use it
        el = (doc || document).getElementById(template);

        if (el && el.tagName.toLowerCase() === "script") {
            return new ko.templateSources.domElement(el);
        }

        //otherwise pull the template in using the AMD loader's text plugin
        if (!(template in sources)) {
            const raw = templateContext('./' + template + '.html');
            const start = raw.indexOf('"') + 1;
            const end = raw.lastIndexOf('"');
            const templateData = raw.substring(start, end).replace(/\\"/g, '"').replace(/\\n/g, '');
            sources[template] = new ko.templateSources.webpackTemplate(template, templateData);
        }

        //keep a single template source instance for each key, so everyone depends on the same observable
        return sources[template];
    }
    //if there is no name (foreach/with) use the elements as the template, as normal
    else if (template && (template.nodeType === 1 || template.nodeType === 8)) {
        return new ko.templateSources.anonymousTemplate(template);
    }
};

//make this new template engine our default engine
ko.setTemplateEngine(engine);
