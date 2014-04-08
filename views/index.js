exports = module.exports = {};

var logger = require("../logger")().addLogger('common-views'),
    conf = require('config'),
    _      = require("underscore"),
    path   = require("path"),
    folio = require('folio'),
    jade = require('jade')
;


/*
 * Definition of views.
 * Update this when a new view is added to mbc-common.
 */
var _views = {};
_views.editor = {
    js:        ['editor.js'],
    templates: ['alert.jade', 'confirm.jade', 'editor.jade', 'objects.jade', 'prompt.jade', 'schedule_prompt.jade'],
    styles:    [],
    images:    [],
    models:    ['Editor.js', 'App.js', 'Default.js', 'Sketch.js'],
    widgets:   conf.Common.Widgets.Files,
};

_views.config = {
    js:        ['conf.js'],
    templates: ['confview.jade', 'conftemplates.jade', 'widgets.jade'],
    styles:    [],
    images:    [],
    models:    ['App.js', 'Default.js'],
    widgets:   [],
};


/*
 * Given a view, turns all the relative paths to absolute and returns it.
 */
function setupView (view) {
    if (!view) {
        logger.error('setupView(): no view');
        return;
    }

    function useCommonPath(fn) {
        return (path.basename(fn) == fn);
    };
    function buildDefaultPath (key, fn) {
        return path.join(__dirname, key, fn);
    };
    function buildPath (key, fn) {
        return require.resolve(path.join('../', key, fn));
    };

    var mappings = {
        models: buildPath,
        widgets: buildPath,
    };
    var ret = {}

    _.each(view, function(value, key) {
        ret[key] = value.map(function(fn) {
            if (!useCommonPath(fn)) return fn;
            if (mappings[key]) {
                return mappings[key](key, fn);
            } else {
                return buildDefaultPath(key, fn);
            }
        });
    });

    return ret;
};
exports.setupView = setupView;

/*
 * All the views with absolute paths to its resources.
 */
var views = exports.views = {};

_.each(_views, function(view, name) {
    exports.views[name] = setupView(view);
});

/*
 * Given a mixed list of views or view names, take all of their resources and merge them.
 * Returns an object with unique keys for images, styles, templates, js and model files.
 */
function mergeViews() {
    var tmp = {};
    var ret = {};

    _.each(arguments, function(name) {
        var view;
        if (typeof(name) == 'string') {
            view = views[name];
        } else {
            view = name;
        }

        if (!view) {
            logger.error('mergeViews() no such view: ', name);
            return;
        }

        _.each(view, function(value, key) {
            tmp[key] || (tmp[key] = []);
            tmp[key].push(value);
        });
    });

    _.each(tmp, function(value, key) {
        ret[key] = _.union.apply(_, value);
    });

    return ret;
};
exports.mergeViews = mergeViews;

/*
 * Given a plain template name (like "config")
 * prepends the full path to it and adds the .jade extension if needed.
 * Mostly useful inside a jade compiler.
 */
function getTemplateFilename(templates, name) {
    return templates.filter( function(template) {
        var basename = path.basename(template);
        if (!name.match(/\.jade$/)) {
            name = name + '.jade';
        }
        return (basename == name);
    });
};
exports.getTemplateFilename = getTemplateFilename;


/*
 * Given a view or the result of mergeViews() this makes a folio for the
 * js, models and templates using the proper jade compiler.
 * Returns: an object with keys that map from the resources to a folio.Glossary.
 */
function makeViewFolios(view) {
    var template_init = path.join(__dirname, '..', 'views/templates/js/header.js');
    var jade_runtime = require.resolve('jade/runtime.js');
    var jade_compiler = function (name, source) {
        var ret =  'template[\'' + name + '\'] = ' +
            jade.compile(source, {
                filename: getTemplateFilename(view.templates, name),
                client: true,
                compileDebug: false
            }) + ';';
        return ret;
    };

    function makeTemplateFolio(templates) {
        var ret = new folio.Glossary(
            [ jade_runtime, template_init ].concat(templates),
            {
                compilers: {
                    jade: jade_compiler,
                }
            }
        );
        return ret;
    };

    function makeFolio(files) {
        return new folio.Glossary(files);
    };

    var folioMappings = {
        templates: makeTemplateFolio,
    };

    var ret = {};
    _.each(view, function(value, key) {
        if (folioMappings[key]) {
            ret[key] = folioMappings[key](value);
        } else {
            ret[key] = makeFolio(value);
        }
    });
    return ret;
};
exports.makeViewFolios = makeViewFolios;
