Package.describe({
  name: "tap-tests:project-with-translation-files-under-server-dir",
  version: "0.0.1"
});

both = ['server', 'client'];
server = 'server';
client = 'client';
Package.on_use(function (api) {
  api.use(['tap:i18n'], both);

  api.use(['tap-tests:blank-package-tap-i18n'], both);
  api.use(['tap-tests:custom-package-tap-i18n'], both);
  api.use(['tap-tests:empty-object-package-tap-i18n'], both);

  api.use(['templating'], client);
  api.use(['coffeescript'], both);

  api.add_files('index.html', client);

  api.export("TAPi18n");

  api.add_files([
    'server/file2.en.i18n.json',
    'server/bb.i18n.json',
    'server/cc-CC.i18n.json'
  ], both);
});

Package.onTest(function(api) {
  api.versionsFrom('METEOR@0.9.1');

  api.use('tinytest', both);

  api.use('coffeescript', both);

  api.use('tap-tests:project-with-translation-files-under-server-dir', both);

  api.addFiles('test/common-tests/both/enabled.coffee', both);
  api.addFiles('test/common-tests/client/enabled.coffee', client);
  api.addFiles('test/common-tests/server/enabled.coffee', server);

  api.addFiles('test/both.coffee', both);
  api.addFiles('test/client.coffee', client);
  api.addFiles('test/server.coffee', server);

  api.export("TAPi18n");
});
