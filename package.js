Package.describe({
  summary: 'A comprehensive internationalization solution for Meteor'
});

Package.on_use(function (api) {
  api.use(["underscore", "coffeescript", "meteor", "deps", "session", "jquery", "templating"], ['client']);

  // load and init TapI18next
  api.add_files('lib/tap_i18next/tap_i18next-1.7.3.js', ['client']);
  api.export("TapI18next");
  api.add_files('lib/tap_i18next/tap_i18next_init.js', ['client']);

  // load TapI18n
  // bare since we need TapI18n in the package level and coffee adds vars to
  // all (so without bare all vars are in the file level)
  api.add_files('lib/tap_i18n/tap_i18n.coffee', ['client'], {bare: true});
  api.export("TapI18n");
});

// Register our build plugin
Package._transitional_registerBuildPlugin({
  name: "compileI18n",
  use: ["coffeescript", "meteor", "simple-schema", "check", "templating"],
  sources: [
    'lib/plugin/wrench.js',
    'lib/plugin/compile-i18n.coffee'
  ]
});

Package.on_test(function (api) {  
});
