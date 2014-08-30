Package.describe({
  name: 'tap:i18n',
  summary: 'A comprehensive internationalization solution for Meteor',
  version: '0.9.0',
  git: 'https://github.com/TAPevents/tap-i18n'
});

both = ['server', 'client'];
server = 'server';
client = 'client';

Package.onUse(function (api) {
  api.versionsFrom('METEOR@0.9.0');

  api.use('coffeescript', both);
  api.use('underscore', both);
  api.use('meteor', both);

  api.use('deps', client);
  api.use('session', client);
  api.use('jquery', client);
  api.use('templating', client);

  api.use('raix:http-methods@0.0.23', server);

  // load and init TAPi18next
  api.add_files('lib/tap_i18next/tap_i18next-1.7.3.js', client);
  api.export('TAPi18next');
  api.add_files('lib/tap_i18next/tap_i18next_init.js', client);

  // load TAPi18n
  api.add_files('lib/globals.js', both);

  // We use the bare option since we need TAPi18n in the package level and
  // coffee adds vars to all (so without bare all vars are in the file level)
  api.add_files('lib/tap_i18n/tap_i18n-common.coffee', server);
  api.add_files('lib/tap_i18n/tap_i18n-common.coffee', client, {bare: true});

  api.add_files('lib/tap_i18n/tap_i18n-server.coffee', server);
  api.add_files('lib/tap_i18n/tap_i18n-client.coffee', client, {bare: true});

  api.export('TAPi18n');
});

// Register our build plugin
Package._transitional_registerBuildPlugin({
  name: 'compileI18n',
  use: ['coffeescript', 'meteor', 'aldeed:simple-schema@0.7.0', 'check', 'templating'],
  sources: [
    'lib/globals.js',
    'lib/plugin/wrench.js',
    'lib/plugin/language_names.js',
    'lib/plugin/compile-i18n.coffee'
  ]
});
