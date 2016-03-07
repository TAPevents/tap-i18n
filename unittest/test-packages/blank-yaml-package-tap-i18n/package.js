Package.describe({
  name: "tap-tests:blank-yaml-package-tap-i18n",
  version: "0.0.1"
});

both = ['server', 'client'];
server = 'server';
client = 'client';
Package.on_use(function (api) {
  api.use(['tap:i18n'], both);

  api.use(['templating'], client);
  api.use(['coffeescript'], both);

  // This must be loaded before any template
  api.add_files('package-tap.i18n', both);

  api.add_files('index.html', client);

  // These must be loaded after all templates
  api.add_files([
    'i18n/file1.en.i18n.yml',
    'i18n/file2.en.i18n.yml',
    'i18n/bb.i18n.yml',
    'i18n/cc.i18n.yml',
    'i18n/cc-CC.i18n.yml'
  ], both);

  api.export('blank_tap_i18n_package__translate');

  api.add_files('post-load-template.html', client);

  api.add_files('lib/both.coffee', both);
  api.add_files('lib/client.coffee', client);
});

Package.onTest(function(api) {
  api.versionsFrom('METEOR@0.9.1');

  api.use('underscore', both);

  api.use('tinytest', both);

  api.use('coffeescript', both);

  api.use('templating', both);

  api.use('tap-tests:blank-yaml-package-tap-i18n', both);

  api.addFiles('test/common-tests/both/disabled.coffee', both);
  api.addFiles('test/common-tests/server/disabled.coffee', server);
  api.addFiles('test/common-tests/client/disabled.coffee', client);

  api.addFiles('test/both.coffee', both);
  api.addFiles('test/client.coffee', client);
  api.addFiles('test/server.coffee', server);
});