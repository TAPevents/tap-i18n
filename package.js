Package.describe({
  summary: 'A comprehensive internationalization solution for Meteor'
});

Package.on_use(function (api) {
  api.use(["coffeescript", "underscore", "meteor"], ['server', 'client']);
  api.use(["http-methods"], 'server');
  api.use(["deps", "session", "jquery", "templating"], 'client');

  // load and init TAPi18next
  api.add_files('lib/tap_i18next/tap_i18next-1.7.3.js', 'client');
  api.export("TAPi18next");
  api.add_files('lib/tap_i18next/tap_i18next_init.js', 'client');

  // load TAPi18n
  api.add_files('lib/globals.js', ['client', 'server']);
  api.add_files('lib/tap_i18n/tap_i18n-common.coffee', 'server');

  // We use the bare option since we need TAPi18n in the package level and
  // coffee adds vars to all (so without bare all vars are in the file level)
  api.add_files('lib/tap_i18n/tap_i18n-common.coffee', 'client', {bare: true});

  api.add_files('lib/tap_i18n/tap_i18n-server.coffee', 'server');
  api.add_files('lib/tap_i18n/tap_i18n-client.coffee', 'client', {bare: true});

  api.export("TAPi18n");
});

// Register our build plugin
Package._transitional_registerBuildPlugin({
  name: "compileI18n",
  use: ["coffeescript", "meteor", "simple-schema", "check", "templating"],
  sources: [
    'lib/globals.js',
    'lib/plugin/wrench.js',
    'lib/plugin/language_names.js',
    'lib/plugin/compile-i18n.coffee'
  ]
});

